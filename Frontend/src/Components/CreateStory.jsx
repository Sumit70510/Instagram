import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from './ui/dialog.jsx';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx';
import { Button } from './ui/button.jsx';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/Lib/api.js';
import { useSelector } from 'react-redux';
import heic2any from 'heic2any';

export default function CreateStory({ open, setOpen, onStoryCreated }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const imageRef = useRef();
  const { user } = useSelector((store) => store.auth);

  const fileChangeHandler = async (e) => {
    const selectedFile = e?.target?.files?.[0];
    if (!selectedFile) return;

    try {
      let processedFile = selectedFile;
      if (
        selectedFile.type.includes('heic') ||
        selectedFile.type.includes('heif') ||
        selectedFile.name.toLowerCase().endsWith('.heic') ||
        selectedFile.name.toLowerCase().endsWith('.heif')
      ) {
        const blob = await heic2any({
          blob: selectedFile,
          toType: 'image/jpeg',
          quality: 0.9,
        });
        processedFile = new File([blob], selectedFile.name.replace(/\.[^/.]+$/, '.jpeg'), {
          type: 'image/jpeg',
        });
      }

      setFile(processedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error(error);
      toast.error('Unable to preview this image. Try another format.');
    }
  };

  const createStoryHandler = async () => {
    if (!file) {
      toast.error('Please select an image for your story.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setLoading(true);
      const res = await api.post('/story/create', formData);
      if (res.data.success) {
        toast.success(res.data.message);
        setPreview('');
        setFile(null);
        setOpen(false);
        onStoryCreated?.(res.data.story);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent onInteractOutside={() => setOpen(false)} className="bg-white dark:bg-zinc-900 text-black dark:text-white">
        <DialogHeader className="text-center font-semibold text-black dark:text-white">Create Story</DialogHeader>
        <div className="flex gap-3 items-center mb-4">
          <Avatar className="text-black">
            <AvatarImage src={user?.profilePicture} alt="Profile" />
            <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase() || 'CN'}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold text-xs text-black">{user?.username}</h1>
            <span className="text-xs text-gray-600">Share a moment for 24h</span>
          </div>
        </div>

        {preview ? (
          <div className="w-full h-80 flex items-center justify-center overflow-hidden rounded-lg bg-white/5 dark:bg-white/5">
            <img src={preview} alt="Story Preview" className="h-full w-full object-contain" />
          </div>
        ) : (
          <div className="w-full h-80 rounded-lg border border-dashed border-slate-300 dark:border-zinc-700 bg-white/3 dark:bg-white/3 flex items-center justify-center text-slate-500 dark:text-slate-300">
            Choose an image to add to your story
          </div>
        )}

        <input type="file" className="hidden" ref={imageRef} onChange={fileChangeHandler} accept="image/*" />

        <div className="mt-4 flex flex-col gap-3">
          <Button
            className="w-full bg-[#0095F6] hover:bg-[#045d99]"
            onClick={() => imageRef.current.click()}
          >
            Select Image
          </Button>
          <Button className="w-full" onClick={createStoryHandler} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              'Add to Story'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
