import { Worker } from 'bullmq';
import axios from 'axios';
import Redis from 'ioredis';
import { redisConnectionOptions } from '../../config/redis.js';
import Automation from './automation.model.js';
import { getValidToken } from '../../utils/tokenManager.js';
import { User } from '../auth/auth.model.js';

// Use a dedicated connection for the Worker
const workerConnection = process.env.REDIS_URL 
    ? new Redis(process.env.REDIS_URL, redisConnectionOptions) 
    : null;

if (workerConnection) {
    workerConnection.on('error', (err) => {
        if (err.message.includes('ECONNRESET') || err.message.includes('ETIMEDOUT')) return;
        console.error('🔴 Worker Redis error:', err.message);
    });
}

const worker = new Worker('CrossPostQueue', async (job) => {
    const { postId, userId, caption, title, body, hashtags, link, platforms, mediaUrl } = job.data;
    
    await Automation.findByIdAndUpdate(postId, { status: 'PROCESSING' });
    console.log(`Executing Scheduled Job ${job.id} for Post ${postId}`);

    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found. Cannot retrieve tokens.');
    }

    const publishTasks = [];

    // Helper to extract specific platform tasks
    const addPlatformTask = (promise, platformName) => {
        return promise.then(result => ({ status: 'fulfilled', platform: platformName, result }))
                      .catch(error => ({ status: 'rejected', platform: platformName, error: error.response?.data || error.message }));
    };

    // --- LINKEDIN EXECUTION ---
    if (platforms.includes('LinkedIn') || platforms.includes('linkedin')) {
        publishTasks.push(addPlatformTask((async () => {
            const token = await getValidToken(userId, 'linkedin');
            const account = user.getSocialAccount('linkedin');
            const personId = account.platformUserId; // urn:li:person:ID

            // 1. Download media into memory
            const mediaBufferResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
            const mediaBuffer = Buffer.from(mediaBufferResponse.data);
            const isVideo = mediaUrl.match(/\.(mp4|mov|wmv|flv|avi|webm|mkv)$/i);

            let mediaUrn = '';
            let uploadToken = null;

            // 2 & 3. Initialize and Execute Upload
            if (isVideo) {
                const initRes = await axios.post('https://api.linkedin.com/rest/videos?action=initializeUpload', {
                    initializeUploadRequest: {
                        owner: `urn:li:person:${personId}`,
                        fileSizeBytes: mediaBuffer.length
                    }
                }, { headers: { 'Authorization': `Bearer ${token}`, 'LinkedIn-Version': '202601', 'X-Restli-Protocol-Version': '2.0.0', 'Content-Type': 'application/json' } });

                mediaUrn = initRes.data.value.video;
                uploadToken = initRes.data.value.uploadToken;
                const uploadInstructions = initRes.data.value.uploadInstructions;

                // Upload each chunk as instructed by LinkedIn
                const uploadedPartIds = [];
                for (const instruction of uploadInstructions) {
                    const chunk = mediaBuffer.slice(instruction.firstByte, instruction.lastByte + 1);
                    const chunkRes = await axios.put(instruction.uploadUrl, chunk, {
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            'Authorization': `Bearer ${token}`
                        },
                        maxBodyLength: Infinity,
                        maxContentLength: Infinity
                    });
                    // LinkedIn requires the ETag header values for uploadedPartIds
                    console.log('Chunk upload headers:', chunkRes.headers);
                    if (chunkRes.headers.etag) {
                        // Some endpoints return ETags with quotes, we keep them as is unless LinkedIn complains
                        uploadedPartIds.push(chunkRes.headers.etag.replace(/"/g, ''));
                    } else if (chunkRes.headers.Etag || chunkRes.headers.ETag) {
                        const etag = chunkRes.headers.Etag || chunkRes.headers.ETag;
                        uploadedPartIds.push(etag.replace(/"/g, ''));
                    } else {
                        console.error('MISSING ETAG IN HEADERS FOR LINKEDIN CHUNK:', instruction);
                    }
                }

                console.log('Sending finalizeUploadRequest with ETags:', uploadedPartIds);
                // Finalize Upload
                await axios.post('https://api.linkedin.com/rest/videos?action=finalizeUpload', {
                    finalizeUploadRequest: {
                        video: mediaUrn,
                        uploadToken: uploadToken,
                        uploadedPartIds: uploadedPartIds
                    }
                }, { headers: { 'Authorization': `Bearer ${token}`, 'LinkedIn-Version': '202601', 'X-Restli-Protocol-Version': '2.0.0', 'Content-Type': 'application/json' } });

            } else {
                // Image Upload
                const initRes = await axios.post('https://api.linkedin.com/rest/images?action=initializeUpload', {
                    initializeUploadRequest: {
                        owner: `urn:li:person:${personId}`
                    }
                }, { headers: { 'Authorization': `Bearer ${token}`, 'LinkedIn-Version': '202601', 'X-Restli-Protocol-Version': '2.0.0', 'Content-Type': 'application/json' } });

                const uploadUrl = initRes.data.value.uploadUrl;
                mediaUrn = initRes.data.value.image;

                await axios.put(uploadUrl, mediaBuffer, {
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'Authorization': `Bearer ${token}`
                    },
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity
                });
            }

            // 4. Create Post
            const fullBody = [
                title, 
                body || caption, 
                hashtags, 
                link
            ].filter(Boolean).join('\n\n');

            const payload = {
                author: `urn:li:person:${personId}`,
                commentary: fullBody,
                visibility: "PUBLIC",
                distribution: {
                    feedDistribution: "MAIN_FEED",
                    targetEntities: [],
                    thirdPartyDistributionChannels: []
                },
                content: {
                    media: {
                        id: mediaUrn
                    }
                },
                lifecycleState: "PUBLISHED",
                isReshareDisabledByAuthor: false
            };

            return axios.post('https://api.linkedin.com/rest/posts', payload, {
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'LinkedIn-Version': '202601',
                    'X-Restli-Protocol-Version': '2.0.0',
                    'Content-Type': 'application/json'
                }
            });
        })(), 'LinkedIn'));
    }

    // --- FACEBOOK EXECUTION ---
    if (platforms.includes('Facebook') || platforms.includes('facebook')) {
        publishTasks.push(addPlatformTask((async () => {
            const userToken = await getValidToken(userId, 'facebook');
            
            // Fetch the Facebook Pages this user manages to get the Page ID and Page Access Token
            const pagesRes = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
                params: { access_token: userToken }
            });
            
            const page = pagesRes.data.data?.[0];
            if (!page) {
                throw new Error("No Facebook Page found. You must have a Facebook Page to publish content.");
            }
            
            const pageId = page.id;
            const pageToken = page.access_token;

            // Simple check to determine if it's a video (can be improved)
            const endpointType = mediaUrl.match(/\.(mp4|mov|wmv|flv|avi)$/i) ? 'videos' : 'photos';

            const fullBody = [
                body || caption,
                hashtags,
                link
            ].filter(Boolean).join('\n\n');

            const payload = {
                url: mediaUrl,
                access_token: pageToken
            };

            if (endpointType === 'videos') {
                if (title) payload.title = title;
                payload.description = fullBody;
            } else {
                payload.message = [title, fullBody].filter(Boolean).join('\n\n');
            }

            return axios.post(`https://graph.facebook.com/v19.0/${pageId}/${endpointType}`, payload);
        })(), 'Facebook'));
    }

    // --- INSTAGRAM EXECUTION ---
    if (platforms.includes('Instagram') || platforms.includes('instagram')) {
        publishTasks.push(addPlatformTask((async () => {
            const token = await getValidToken(userId, 'instagram');
            const account = user.getSocialAccount('instagram');
            const igAccountId = account.platformUserId;

            const isVideo = mediaUrl.match(/\.(mp4|mov|wmv|flv|avi|webm|mkv)$/i);

            // Step 1: Create media container
            const fullCaption = [
                title,
                body || caption,
                hashtags,
                link
            ].filter(Boolean).join('\n\n');

            const createPayload = {
                caption: fullCaption,
                access_token: token
            };

            if (isVideo) {
                createPayload.video_url = mediaUrl;
                createPayload.media_type = 'REELS';
            } else {
                createPayload.image_url = mediaUrl;
            }

            const createContainerResponse = await axios.post(`https://graph.facebook.com/v19.0/${igAccountId}/media`, createPayload);
            const creationId = createContainerResponse.data.id;

            // Step 1.5: Wait for processing if video
            if (isVideo) {
                let status = 'IN_PROGRESS';
                let attempts = 0;
                while (status !== 'FINISHED' && status !== 'ERROR' && attempts < 20) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    const statusRes = await axios.get(`https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${token}`);
                    status = statusRes.data.status_code;
                    attempts++;
                }
                if (status !== 'FINISHED') {
                    throw new Error(`Instagram Video Processing failed or timed out. Status: ${status}`);
                }
            }

            // Step 2: Publish the media
            return axios.post(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
                creation_id: creationId,
                access_token: token
            });
        })(), 'Instagram'));
    }

    // --- YOUTUBE EXECUTION ---
    if (platforms.includes('YouTube') || platforms.includes('youtube')) {
        publishTasks.push(addPlatformTask((async () => {
            // YouTube ONLY accepts videos. If it's an image, throw an error early.
            const isVideo = mediaUrl.match(/\.(mp4|mov|wmv|flv|avi|webm|mkv)$/i);
            if (!isVideo) {
                throw new Error("YouTube only supports video files. Provided media appears to be an image or unsupported format.");
            }

            const token = await getValidToken(userId, 'youtube');

            // 1. Fetch the video as a Buffer (ArrayBuffer) from Cloudinary
            // YouTube API does NOT support chunked transfer encoding, so we MUST know the exact file size.
            // Downloading as a stream causes form-data to use chunked encoding, which silently fails on YouTube.
            const videoBufferResponse = await axios.get(mediaUrl, {
                responseType: 'arraybuffer'
            });

            const videoBuffer = Buffer.from(videoBufferResponse.data);

            const FormData = (await import('form-data')).default;
            const form = new FormData();

            const fullDesc = [
                body || caption,
                hashtags,
                link
            ].filter(Boolean).join('\n\n');

            const fallbackTitle = (title || caption || "Video").substring(0, 100);

            let tagsArray = [];
            if (hashtags) {
                tagsArray = hashtags.split(/\s+/).map(t => t.replace('#', '')).filter(Boolean);
            }

            const metadata = {
                snippet: {
                    title: fallbackTitle, 
                    description: fullDesc,
                    categoryId: "22"
                },
                status: {
                    privacyStatus: "public" // or "unlisted" / "private"
                }
            };

            if (tagsArray.length > 0) {
                metadata.snippet.tags = tagsArray;
            }

            form.append('metadata', JSON.stringify(metadata), { contentType: 'application/json' });
            form.append('media', videoBuffer, { contentType: 'video/mp4', filename: 'video.mp4' });

            return axios.post(
                'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status', 
                form, 
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        ...form.getHeaders() // This will now include a proper Content-Length header
                    },
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity
                }
            );
        })(), 'YouTube'));
    }

    // Execute concurrently
    const results = await Promise.allSettled(publishTasks);

    // Evaluate results
    const successful = results.filter(r => r.value && r.value.status === 'fulfilled');
    const failed = results.filter(r => r.value && r.value.status === 'rejected');

    failed.forEach(f => {
        console.error(`[Worker] Platform ${f.value.platform} failed for post ${postId}:`, JSON.stringify(f.value.error));
    });

    let finalStatus = 'COMPLETED';
    if (failed.length === publishTasks.length && publishTasks.length > 0) {
        finalStatus = 'FAILED';
    } else if (failed.length > 0) {
        finalStatus = 'PARTIAL_SUCCESS';
    }

    await Automation.findByIdAndUpdate(postId, { status: finalStatus });
    console.log(`Job ${job.id} completed with status: ${finalStatus}. Success: ${successful.length}, Failed: ${failed.length}`);

}, { 
    connection: workerConnection,
    concurrency: 5 // Processing up to 5 jobs concurrently
});

// Graceful Failure Handling
worker.on('failed', async (job, err) => {
    console.error(`Job ${job.id} failed fundamentally: ${err.message}`);
    if (job?.data?.postId) {
        await Automation.findByIdAndUpdate(job.data.postId, { status: 'FAILED' });
    }
});

worker.on('error', err => {
    if (err.message.includes('ECONNRESET') || err.message.includes('ETIMEDOUT') || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
        // BullMQ will auto-reconnect, swallow these Upstash idle disconnects
        return;
    }
    console.error('🔴 BullMQ Worker Error:', err.message);
});

export default worker;