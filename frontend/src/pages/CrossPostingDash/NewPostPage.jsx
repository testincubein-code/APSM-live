import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import crosspostApi from "@/services/crosspostApi";
import { useCrossPost } from "./CrossPostContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  Send,
  Image as ImageIcon,
  Video,
  X,
  Bold,
  Italic,
  Underline,
  List,
  Link2,
  Smile,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Youtube, Linkedin, Facebook, Instagram } from "@/components/icons/BrandIcons";

const SUPPORTED_PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-[#1877f2]", activeBorder: "border-[#1877f2]" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-[#bc1888]", activeBorder: "border-[#bc1888]" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-[#ff0000]", activeBorder: "border-[#ff0000]" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-[#0077b5]", activeBorder: "border-[#0077b5]" },
];

export default function NewPostPage() {
  const navigate = useNavigate();
  const { postHistory, addToHistory, connectedPlatforms, isLoadingAuth } = useCrossPost();
  const { toast } = useToast();

  // ── Form State (react-hook-form) ──────────────────────────────────
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: "",
      body: "",
      hashtags: "",
      link: "",
      platforms: [],
      mediaFile: null,
    }
  });

  const titleVal = watch("title", "");
  const bodyVal = watch("body", "");
  const selectedPlatforms = watch("platforms", []);
  const mediaFile = watch("mediaFile", null);

  // ── Media State ───────────────────────────────────────────────────
  const [mediaPreview, setMediaPreview] = useState(null);
  const fileInputRef = useRef(null);

  // ── Scheduling State ──────────────────────────────────────────────
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch Connected Platforms ─────────────────────────────────────
  useEffect(() => {
    // Register mediaFile explicitly since we use custom drag/drop UI
    register("mediaFile");
  }, [register]);

  // ── Handlers ──────────────────────────────────────────────────────
  const togglePlatform = (platformId) => {
    if (!connectedPlatforms.includes(platformId)) return;
    if (selectedPlatforms.includes(platformId)) {
      setValue("platforms", selectedPlatforms.filter(id => id !== platformId));
    } else {
      setValue("platforms", [...selectedPlatforms, platformId]);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File exceeds 50MB limit.",
        variant: "destructive"
      });
      return;
    }
    setValue("mediaFile", file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const removeMedia = () => {
    setValue("mediaFile", null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Submit Logic ──────────────────────────────────────────────────
  const onSubmit = async (data) => {
    // 1. Validation
    if (!data.title?.trim() && !data.body?.trim()) {
      toast({ description: "You must provide either a title or a body.", variant: "destructive" });
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast({ description: "Please select at least one platform.", variant: "destructive" });
      return;
    }
    if (selectedPlatforms.includes("youtube") && data.mediaFile && !data.mediaFile.type.startsWith("video/")) {
      toast({ description: "YouTube only supports video uploads.", variant: "destructive" });
      return;
    }
    if (isScheduling && !scheduleDate) {
      toast({ description: "Please select a valid schedule date and time.", variant: "destructive" });
      return;
    }

    // 2. Build Payload
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.body) formData.append("body", data.body);
    if (data.hashtags) formData.append("hashtags", data.hashtags);
    if (data.link) formData.append("link", data.link);
    formData.append("platforms", JSON.stringify(selectedPlatforms));

    if (data.mediaFile) {
      formData.append("mediaFile", data.mediaFile);
    }

    let finalDate = null;
    if (isScheduling && scheduleDate) {
      try {
        finalDate = new Date(scheduleDate).toISOString();
        formData.append("scheduledDate", finalDate);
      } catch (e) {
        toast({ description: "Invalid schedule date format.", variant: "destructive" });
        return;
      }
    }

    // 3. Post to API
    setIsSubmitting(true);
    try {
      await crosspostApi.submitJob(formData);

      toast({
        title: "Success",
        description: finalDate ? "Post scheduled successfully!" : "Post published successfully!"
      });

      // Update Context History
      addToHistory({
        caption: data.title || data.body || "New Post",
        platforms: selectedPlatforms,
        status: finalDate ? "Scheduled" : "Published",
        scheduledFor: finalDate,
        thumbnail: mediaPreview || null
      });

      // Reset form
      setValue("title", "");
      setValue("body", "");
      setValue("hashtags", "");
      setValue("link", "");
      setValue("platforms", []);
      removeMedia();
      setIsScheduling(false);
      setScheduleDate("");

    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to submit post.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] text-slate-100 p-2 md:p-6 space-y-6 animate-fade-in -m-6 sm:-m-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-6 px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/crosspost")} className="hover:bg-white/5">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Create New Post</h2>
          <p className="text-sm text-slate-400">Draft and publish your content across platforms</p>
        </div>
      </div>

      <div className="px-4">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── LEFT COLUMN (The Form) ───────────────────────────────────── */}
          <div className="space-y-6">

            {/* Title */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-300">Title / Headline <span className="text-red-400">*</span></label>
                <span className={`text-xs ${titleVal.length > 100 ? "text-red-400" : "text-slate-500"}`}>
                  {titleVal.length} / 100
                </span>
              </div>
              <input
                type="text"
                {...register("title", { required: true, maxLength: 100 })}
                placeholder="Catchy headline for your post"
                className="w-full bg-[#1e2230] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-slate-500"
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-300">Body / Description</label>
                <span className={`text-xs ${bodyVal.length > 2000 ? "text-red-400" : "text-slate-500"}`}>
                  {bodyVal.length} / 2000
                </span>
              </div>
              <textarea
                {...register("body", { maxLength: 2000 })}
                placeholder="What do you want to share?"
                className="w-full bg-[#1e2230] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-[#6366f1] resize-none h-32 transition-colors placeholder:text-slate-500"
              />
            </div>

            {/* Hashtags & Link (2 columns) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Hashtags</label>
                <input
                  type="text"
                  {...register("hashtags")}
                  placeholder="#tech #innovation"
                  className="w-full bg-[#1e2230] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Link (Optional)</label>
                <input
                  type="url"
                  {...register("link")}
                  placeholder="https://example.com"
                  className="w-full bg-[#1e2230] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Media Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Media (Max size 50MB)</label>
              {!mediaPreview ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center bg-[#141720] hover:bg-[#1e2230] transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex justify-center mb-3">
                    <ImageIcon className="h-8 w-8 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-300">Drag & drop your image or video here</p>
                  <p className="text-xs text-slate-500 mt-1">or click to browse files</p>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden bg-[#141720] border border-white/10 aspect-video flex items-center justify-center">
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full hover:bg-black text-white z-10 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {mediaFile?.type.startsWith("video/") ? (
                    <video src={mediaPreview} controls className="max-h-full max-w-full object-contain" />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                  )}
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*"
              />
            </div>

            {/* Schedule Date Picker (Conditional) */}
            {isScheduling && (
              <div className="p-4 bg-[#141720] border border-[#6366f1]/30 rounded-lg space-y-2 animate-in slide-in-from-top-2">
                <label className="text-sm font-medium text-slate-300 block">Select Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full bg-[#1e2230] border border-white/10 rounded-md p-2.5 text-sm text-slate-200 focus:border-[#6366f1] focus:outline-none"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className={`flex-1 border-[#6366f1] text-[#6366f1] hover:bg-[#6366f1]/10 ${isScheduling ? "bg-[#6366f1]/10" : "bg-transparent"}`}
                onClick={() => setIsScheduling(!isScheduling)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Post
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isScheduling ? "Confirm Schedule" : "Post Now"}
              </Button>
            </div>

          </div>


          {/* ── RIGHT COLUMN (Platforms & History) ────────────────────────── */}
          <div className="space-y-8">

            {/* Platforms Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-200">Select Platforms</h3>
                {isLoadingAuth && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {SUPPORTED_PLATFORMS.map(platform => {
                  const isConnected = connectedPlatforms.includes(platform.id);
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <div
                      key={platform.id}
                      onClick={() => isConnected && togglePlatform(platform.id)}
                      className={`relative p-4 rounded-xl border transition-all 
                        ${isConnected ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}
                        ${isSelected ? `border-[#6366f1] bg-[#6366f1]/5 shadow-[0_0_15px_rgba(99,102,241,0.1)]` : "border-white/5 bg-[#141720] hover:bg-white/5"}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <platform.icon className={`h-6 w-6 ${platform.color}`} />
                        <div>
                          <p className="font-semibold text-sm text-slate-200">{platform.name}</p>
                          <p className="text-xs text-slate-500">{isConnected ? "Connected" : "Not connected"}</p>
                        </div>
                      </div>
                      {/* Selection Checkbox Visual */}
                      <div className={`absolute top-4 right-4 h-4 w-4 rounded-full border flex items-center justify-center transition-colors
                        ${isSelected ? "border-[#6366f1] bg-[#6366f1]" : "border-slate-600 bg-transparent"}
                      `}>
                        {isSelected && <div className="h-2 w-2 bg-white rounded-full" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* History Table */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200">Recent Activity</h3>
              <Card className="bg-[#141720] border-white/5 shadow-none overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs text-slate-500 uppercase bg-[#1e2230] border-b border-white/5">
                      <tr>
                        <th className="px-4 py-3 font-medium">Content</th>
                        <th className="px-4 py-3 font-medium">Platforms</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {postHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                            No recent activity found.
                          </td>
                        </tr>
                      ) : (
                        postHistory.slice(0, 6).map((post) => (
                          <tr key={post.id} className="hover:bg-white/[0.02]">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {post.thumbnail ? (
                                  <img src={post.thumbnail} className="h-8 w-8 rounded object-cover border border-white/10" alt="thumb" />
                                ) : (
                                  <div className="h-8 w-8 rounded bg-[#1e2230] flex items-center justify-center border border-white/10">
                                    <ImageIcon className="h-4 w-4 text-slate-600" />
                                  </div>
                                )}
                                <span className="truncate max-w-[150px] font-medium text-slate-200 text-xs">
                                  {post.caption}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5">
                                {post.platforms.map(p => {
                                  const config = SUPPORTED_PLATFORMS.find(cp => cp.id === p);
                                  if (!config) return null;
                                  return <config.icon key={p} className={`h-4 w-4 ${config.color}`} title={config.name} />;
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium
                                ${post.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                                ${post.status === 'Scheduled' ? 'bg-amber-500/10 text-amber-400' : ''}
                                ${post.status === 'Failed' ? 'bg-red-500/10 text-red-400' : ''}
                              `}>
                                {post.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                              {post.scheduledFor ? new Date(post.scheduledFor).toLocaleString() : new Date(post.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button className="text-slate-500 hover:text-slate-300">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {postHistory.length > 6 && (
                  <div className="bg-[#1e2230] border-t border-white/5 p-3 flex justify-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate("/dashboard/crosspost/history")}
                      className="text-xs text-[#6366f1] hover:text-[#4f46e5] hover:bg-transparent"
                    >
                      View in details
                    </Button>
                  </div>
                )}
              </Card>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}