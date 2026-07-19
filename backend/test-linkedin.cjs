require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const User = require('./modules/auth/auth.model.js').User;
    const user = await User.findOne({ 'socialAccounts.platform': 'linkedin' });
    if (!user) { console.log('No user found'); process.exit(0); }
    
    const account = user.socialAccounts.find(a => a.platform === 'linkedin');
    const token = account.accessToken;
    const personId = account.platformUserId;
    
    console.log('1. Initialize Upload');
    const initRes = await axios.post('https://api.linkedin.com/rest/videos?action=initializeUpload', {
        initializeUploadRequest: {
            owner: 'urn:li:person:' + personId,
            fileSizeBytes: 100
        }
    }, { headers: { 'Authorization': 'Bearer ' + token, 'LinkedIn-Version': '202601', 'X-Restli-Protocol-Version': '2.0.0', 'Content-Type': 'application/json' } });
    
    const instruction = initRes.data.value.uploadInstructions[0];
    const mediaUrn = initRes.data.value.video;
    const uploadToken = initRes.data.value.uploadToken;
    const chunk = Buffer.alloc(100, 0); 
    
    console.log('2. Upload Chunk');
    const uploadedPartIds = [];
    const chunkRes = await axios.put(instruction.uploadUrl, chunk, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Authorization': 'Bearer ' + token
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });
    
    if (chunkRes.headers.etag) {
        uploadedPartIds.push(chunkRes.headers.etag.replace(/\"/g, ''));
    } else {
        console.log('NO ETAG');
    }
    
    console.log('ETags:', uploadedPartIds);
    
    console.log('3. Finalize Upload');
    try {
        const finRes = await axios.post('https://api.linkedin.com/rest/videos?action=finalizeUpload', {
            finalizeUploadRequest: {
                video: mediaUrn,
                uploadToken: uploadToken,
                uploadedPartIds: uploadedPartIds
            }
        }, { headers: { 'Authorization': 'Bearer ' + token, 'LinkedIn-Version': '202601', 'X-Restli-Protocol-Version': '2.0.0', 'Content-Type': 'application/json' } });
        console.log('FINALIZE STATUS:', finRes.status);
    } catch (e) {
        console.error('FINALIZE ERROR:', e.response ? e.response.status : e.message);
        if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
    }
    
    process.exit(0);
}
test().catch(console.error);
