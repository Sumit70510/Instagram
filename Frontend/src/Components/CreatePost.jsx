import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import Cropper from 'react-easy-crop';
import heic2any from 'heic2any';

import {
  Crop,
  ImageIcon,
  Loader2,
  RotateCcw,
  RotateCw,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.jsx';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from './ui/avatar.jsx';

import { Textarea } from './ui/textarea.jsx';
import { Button } from './ui/button.jsx';

import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';

import useTheme from '@/Redux/theme.js';
import api from '@/Lib/api.js';
import { setPosts } from '@/Redux/postSlice.js';

const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const ASPECT_RATIOS = [
  {
    label: 'Square',
    value: 1,
  },
  {
    label: 'Portrait',
    value: 4 / 5,
  },
  {
    label: 'Landscape',
    value: 16 / 9,
  },
  {
    label: 'Original',
    value: null,
  },
];

const createImageElement = (source) => {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener('load', () => {
      resolve(image);
    });

    image.addEventListener('error', (error) => {
      reject(error);
    });

    image.setAttribute('crossOrigin', 'anonymous');
    image.src = source;
  });
};

const getRadianAngle = (degreeValue) => {
  return (degreeValue * Math.PI) / 180;
};

const getRotatedSize = (width, height, rotation) => {
  const rotationRadians = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotationRadians) * width) +
      Math.abs(Math.sin(rotationRadians) * height),

    height:
      Math.abs(Math.sin(rotationRadians) * width) +
      Math.abs(Math.cos(rotationRadians) * height),
  };
};

const createCroppedImageFile = async ({
  imageSource,
  pixelCrop,
  rotation,
  fileName,
}) => {
  const image = await createImageElement(imageSource);

  const canvas = document.createElement('canvas');
  const canvasContext = canvas.getContext('2d');

  if (!canvasContext) {
    throw new Error('Image editing is not supported by this browser.');
  }

  const rotationRadians = getRadianAngle(rotation);

  const rotatedSize = getRotatedSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = Math.ceil(rotatedSize.width);
  canvas.height = Math.ceil(rotatedSize.height);

  canvasContext.translate(
    canvas.width / 2,
    canvas.height / 2
  );

  canvasContext.rotate(rotationRadians);

  canvasContext.translate(
    -image.width / 2,
    -image.height / 2
  );

  canvasContext.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedContext = croppedCanvas.getContext('2d');

  if (!croppedContext) {
    throw new Error('Image cropping is not supported.');
  }

  croppedCanvas.width = Math.max(
    1,
    Math.round(pixelCrop.width)
  );

  croppedCanvas.height = Math.max(
    1,
    Math.round(pixelCrop.height)
  );

  croppedContext.drawImage(
    canvas,
    Math.round(pixelCrop.x),
    Math.round(pixelCrop.y),
    Math.round(pixelCrop.width),
    Math.round(pixelCrop.height),
    0,
    0,
    croppedCanvas.width,
    croppedCanvas.height
  );

  const blob = await new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (generatedBlob) => {
        if (!generatedBlob) {
          reject(new Error('Failed to create the cropped image.'));
          return;
        }

        resolve(generatedBlob);
      },
      'image/jpeg',
      0.92
    );
  });

  const fileNameWithoutExtension =
    fileName?.replace(/\.[^/.]+$/, '') || 'post-image';

  return new File(
    [blob],
    `${fileNameWithoutExtension}-edited.jpg`,
    {
      type: 'image/jpeg',
      lastModified: Date.now(),
    }
  );
};

export default function CreatePost({
  open,
  setOpen,
}) {
  const fileInputRef = useRef(null);

  const [caption, setCaption] = useState('');

  const [originalFile, setOriginalFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaType, setMediaType] = useState('');

  const [loading, setLoading] = useState(false);
  const [processingMedia, setProcessingMedia] =
    useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [cropPosition, setCropPosition] = useState({
    x: 0,
    y: 0,
  });

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState(null);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(1);

  const { user } = useSelector((store) => store.auth);

  const { posts = [] } = useSelector(
    (store) => store.post
  );

  const dispatch = useDispatch();

  const { themeMode } = useTheme();
  const isDarkMode = themeMode === 'dark';

  useEffect(() => {
    return () => {
      if (mediaPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  const resetEditor = () => {
    setCropPosition({
      x: 0,
      y: 0,
    });

    setCroppedAreaPixels(null);
    setZoom(1);
    setRotation(0);
    setAspectRatio(1);
    setIsEditing(false);
  };

  const revokeCurrentPreview = () => {
    if (mediaPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreview);
    }
  };

  const createPreview = (file) => {
    revokeCurrentPreview();

    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);

    return previewUrl;
  };

  const clearSelectedMedia = () => {
    revokeCurrentPreview();

    setOriginalFile(null);
    setSelectedFile(null);
    setMediaPreview('');
    setMediaType('');

    resetEditor();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    clearSelectedMedia();

    setCaption('');
    setLoading(false);
    setProcessingMedia(false);
  };

  const closeDialog = () => {
    if (loading || processingMedia) {
      return;
    }

    resetForm();
    setOpen(false);
  };

  const isHeicFile = (file) => {
    const lowerCaseName = file.name.toLowerCase();

    return (
      file.type.toLowerCase().includes('heic') ||
      file.type.toLowerCase().includes('heif') ||
      lowerCaseName.endsWith('.heic') ||
      lowerCaseName.endsWith('.heif')
    );
  };

  const isVideoFile = (file) => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    return (
      fileType.startsWith('video/') ||
      fileName.endsWith('.mp4') ||
      fileName.endsWith('.webm') ||
      fileName.endsWith('.mov') ||
      fileName.endsWith('.m4v')
    );
  };

  const isImageFile = (file) => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    return (
      fileType.startsWith('image/') ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      fileName.endsWith('.png') ||
      fileName.endsWith('.webp') ||
      fileName.endsWith('.heic') ||
      fileName.endsWith('.heif')
    );
  };

  const validateFile = (file) => {
    const imageFile = isImageFile(file);
    const videoFile = isVideoFile(file);

    if (!imageFile && !videoFile) {
      toast.error(
        'Please select a JPG, PNG, WebP, HEIC, MP4, MOV, or WebM file.'
      );

      return false;
    }

    if (imageFile && file.size > MAX_IMAGE_SIZE) {
      toast.error('The image must be smaller than 15 MB.');
      return false;
    }

    if (videoFile && file.size > MAX_VIDEO_SIZE) {
      toast.error('The video must be smaller than 100 MB.');
      return false;
    }

    return true;
  };

  const convertHeicToJpeg = async (file) => {
    const convertedResult = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    });

    const convertedBlob = Array.isArray(convertedResult)
      ? convertedResult[0]
      : convertedResult;

    const convertedFileName = file.name.replace(
      /\.(heic|heif)$/i,
      '.jpg'
    );

    return new File(
      [convertedBlob],
      convertedFileName,
      {
        type: 'image/jpeg',
        lastModified: Date.now(),
      }
    );
  };

  const fileChangeHandler = async (event) => {
    const uploadedFile = event?.target?.files?.[0];

    if (!uploadedFile) {
      return;
    }

    if (!validateFile(uploadedFile)) {
      event.target.value = '';
      return;
    }

    try {
      setProcessingMedia(true);

      let processedFile = uploadedFile;

      if (isHeicFile(uploadedFile)) {
        toast.info('Converting HEIC image...');

        processedFile = await convertHeicToJpeg(
          uploadedFile
        );
      }

      const detectedMediaType = isVideoFile(
        processedFile
      )
        ? 'video'
        : 'image';

      setOriginalFile(processedFile);
      setSelectedFile(processedFile);
      setMediaType(detectedMediaType);

      createPreview(processedFile);
      resetEditor();

      if (detectedMediaType === 'image') {
        setIsEditing(true);

        toast.success(
          'Image selected. Adjust the crop before posting.'
        );
      } else {
        toast.success('Video selected successfully.');
      }
    } catch (error) {
      console.error('Media processing error:', error);

      clearSelectedMedia();

      toast.error(
        'The selected media could not be processed.'
      );
    } finally {
      setProcessingMedia(false);
    }
  };

  const cropCompleteHandler = useCallback(
    (_, croppedPixels) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  const applyCropHandler = async () => {
    if (
      !mediaPreview ||
      !croppedAreaPixels ||
      !selectedFile
    ) {
      toast.error('Crop information is unavailable.');
      return;
    }

    try {
      setProcessingMedia(true);

      const croppedFile = await createCroppedImageFile({
        imageSource: mediaPreview,
        pixelCrop: croppedAreaPixels,
        rotation,
        fileName: selectedFile.name,
      });

      setSelectedFile(croppedFile);
      createPreview(croppedFile);

      resetEditor();

      toast.success('Image changes applied.');
    } catch (error) {
      console.error('Image crop error:', error);

      toast.error(
        error?.message || 'Failed to edit the image.'
      );
    } finally {
      setProcessingMedia(false);
    }
  };

  const cancelEditingHandler = () => {
    resetEditor();
  };

  const restoreOriginalHandler = () => {
    if (!originalFile) {
      return;
    }

    setSelectedFile(originalFile);
    createPreview(originalFile);

    resetEditor();
    setIsEditing(true);

    toast.success('Original image restored.');
  };

  const rotateLeftHandler = () => {
    setRotation((previousRotation) => {
      return previousRotation - 90;
    });
  };

  const rotateRightHandler = () => {
    setRotation((previousRotation) => {
      return previousRotation + 90;
    });
  };

  const createPostHandler = async () => {
    if (!selectedFile) {
      toast.error('Please select an image or video.');
      return;
    }

    if (isEditing) {
      toast.error(
        'Please apply or cancel your image edits first.'
      );

      return;
    }

    if (loading || processingMedia) {
      return;
    }

    const formData = new FormData();

    formData.append('caption', caption.trim());

    /*
     * This uses your existing backend field name.
     * Your Multer middleware should use upload.single("image").
     */
    formData.append('image', selectedFile);

    /*
     * The backend can optionally use this value to distinguish
     * between images and videos.
     */
    formData.append('mediaType', mediaType);

    try {
      setLoading(true);

      const response = await api.post(
        '/post/addpost',
        formData
      );

      if (response.data?.success) {
        const createdPost = response.data.post;

        dispatch(
          setPosts([
            createdPost,
            ...(Array.isArray(posts) ? posts : []),
          ])
        );

        toast.success(
          response.data.message ||
            'Post created successfully.'
        );

        resetForm();
        setOpen(false);
      } else {
        toast.error(
          response.data?.message ||
            'The post could not be created.'
        );
      }
    } catch (error) {
      console.error('Create post error:', error);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create the post.';

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeDialog();
        }
      }}
    >
      <DialogContent
        onInteractOutside={(event) => {
          if (loading || processingMedia) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (loading || processingMedia) {
            event.preventDefault();
          }
        }}
        className={`
          max-h-[95vh]
          w-[95vw]
          max-w-2xl
          overflow-y-auto
          border
          p-0
          sm:w-full
          ${
            isDarkMode
              ? 'border-zinc-800 bg-black text-slate-100'
              : 'border-gray-200 bg-white text-slate-950'
          }
        `}
      >
        <DialogHeader
          className={`
            sticky
            top-0
            z-30
            border-b
            px-5
            py-4
            ${
              isDarkMode
                ? 'border-zinc-800 bg-black'
                : 'border-gray-200 bg-white'
            }
          `}
        >
          <DialogTitle className="text-center text-base font-semibold">
            Create New Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-4 pb-5 sm:px-6">
          <div className="flex items-center gap-3 pt-1">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={user?.profilePicture}
                alt={user?.username || 'Profile image'}
              />

              <AvatarFallback>
                {user?.username
                  ?.slice(0, 2)
                  ?.toUpperCase() || 'US'}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <h2
                className={`
                  truncate
                  text-sm
                  font-semibold
                  ${
                    isDarkMode
                      ? 'text-slate-100'
                      : 'text-black'
                  }
                `}
              >
                {user?.username || 'User'}
              </h2>

              {user?.bio && (
                <p
                  className={`
                    line-clamp-1
                    text-xs
                    ${
                      isDarkMode
                        ? 'text-slate-400'
                        : 'text-gray-500'
                    }
                  `}
                >
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Textarea
              value={caption}
              onChange={(event) => {
                setCaption(event.target.value);
              }}
              disabled={loading || processingMedia}
              maxLength={2200}
              placeholder="Write a caption..."
              className={`
                min-h-24
                resize-none
                focus-visible:ring-1
                ${
                  isDarkMode
                    ? 'border-zinc-700 bg-zinc-900 text-slate-100 focus-visible:ring-zinc-500'
                    : 'border-gray-300 bg-white text-black focus-visible:ring-gray-400'
                }
              `}
            />

            <p
              className={`
                text-right
                text-xs
                ${
                  isDarkMode
                    ? 'text-zinc-500'
                    : 'text-gray-400'
                }
              `}
            >
              {caption.length}/2200
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/webm,video/quicktime,video/x-m4v"
            onChange={fileChangeHandler}
          />

          {!mediaPreview && (
            <button
              type="button"
              disabled={processingMedia || loading}
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className={`
                flex
                min-h-72
                w-full
                flex-col
                items-center
                justify-center
                gap-4
                rounded-xl
                border-2
                border-dashed
                px-5
                transition
                disabled:cursor-not-allowed
                disabled:opacity-60
                ${
                  isDarkMode
                    ? 'border-zinc-700 bg-zinc-950 hover:border-zinc-500 hover:bg-zinc-900'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                }
              `}
            >
              {processingMedia ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin" />

                  <div className="text-center">
                    <p className="font-semibold">
                      Processing media
                    </p>

                    <p
                      className={`
                        mt-1
                        text-sm
                        ${
                          isDarkMode
                            ? 'text-zinc-400'
                            : 'text-gray-500'
                        }
                      `}
                    >
                      HEIC images may take a few seconds.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`
                      rounded-full
                      p-4
                      ${
                        isDarkMode
                          ? 'bg-zinc-800'
                          : 'bg-gray-200'
                      }
                    `}
                  >
                    <Upload className="h-8 w-8" />
                  </div>

                  <div className="text-center">
                    <p className="font-semibold">
                      Select a photo or video
                    </p>

                    <p
                      className={`
                        mt-1
                        text-sm
                        ${
                          isDarkMode
                            ? 'text-zinc-400'
                            : 'text-gray-500'
                        }
                      `}
                    >
                      Images up to 15 MB and videos up to
                      100 MB
                    </p>
                  </div>
                </>
              )}
            </button>
          )}

          {mediaPreview &&
            mediaType === 'image' &&
            isEditing && (
              <div className="space-y-4">
                <div
                  className={`
                    relative
                    h-[420px]
                    w-full
                    overflow-hidden
                    rounded-xl
                    ${
                      isDarkMode
                        ? 'bg-zinc-950'
                        : 'bg-gray-100'
                    }
                  `}
                >
                  <Cropper
                    image={mediaPreview}
                    crop={cropPosition}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={aspectRatio || undefined}
                    objectFit="contain"
                    showGrid
                    onCropChange={setCropPosition}
                    onCropComplete={cropCompleteHandler}
                    onZoomChange={setZoom}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Aspect ratio
                  </p>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {ASPECT_RATIOS.map((ratio) => {
                      const isSelected =
                        aspectRatio === ratio.value;

                      return (
                        <Button
                          key={ratio.label}
                          type="button"
                          size="sm"
                          variant={
                            isSelected
                              ? 'default'
                              : 'outline'
                          }
                          onClick={() => {
                            setAspectRatio(ratio.value);
                          }}
                        >
                          {ratio.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="image-zoom"
                      className="text-sm font-medium"
                    >
                      Zoom
                    </label>

                    <span
                      className={`
                        text-xs
                        ${
                          isDarkMode
                            ? 'text-zinc-400'
                            : 'text-gray-500'
                        }
                      `}
                    >
                      {zoom.toFixed(1)}×
                    </span>
                  </div>

                  <input
                    id="image-zoom"
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(event) => {
                      setZoom(Number(event.target.value));
                    }}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="image-rotation"
                      className="text-sm font-medium"
                    >
                      Rotation
                    </label>

                    <span
                      className={`
                        text-xs
                        ${
                          isDarkMode
                            ? 'text-zinc-400'
                            : 'text-gray-500'
                        }
                      `}
                    >
                      {rotation}°
                    </span>
                  </div>

                  <input
                    id="image-rotation"
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={rotation}
                    onChange={(event) => {
                      setRotation(
                        Number(event.target.value)
                      );
                    }}
                    className="w-full cursor-pointer"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={rotateLeftHandler}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Rotate left
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={rotateRightHandler}
                    >
                      <RotateCw className="mr-2 h-4 w-4" />
                      Rotate right
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={processingMedia}
                    onClick={cancelEditingHandler}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    disabled={processingMedia}
                    onClick={applyCropHandler}
                    className="bg-[#0095F6] text-white hover:bg-[#1877d2]"
                  >
                    {processingMedia ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Applying
                      </>
                    ) : (
                      <>
                        <Crop className="mr-2 h-4 w-4" />
                        Apply changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

          {mediaPreview &&
            mediaType === 'image' &&
            !isEditing && (
              <div className="space-y-3">
                <div
                  className={`
                    relative
                    flex
                    max-h-[550px]
                    min-h-72
                    w-full
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-xl
                    ${
                      isDarkMode
                        ? 'bg-zinc-950'
                        : 'bg-gray-100'
                    }
                  `}
                >
                  <img
                    src={mediaPreview}
                    alt="Selected post preview"
                    className="max-h-[550px] w-full object-contain"
                  />

                  <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/65 px-3 py-1.5 text-xs text-white">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Photo
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading || processingMedia}
                    onClick={() => {
                      setIsEditing(true);
                    }}
                  >
                    <Crop className="mr-2 h-4 w-4" />
                    Edit
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading || processingMedia}
                    onClick={restoreOriginalHandler}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Original
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading || processingMedia}
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Replace
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    disabled={loading || processingMedia}
                    onClick={clearSelectedMedia}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            )}

          {mediaPreview &&
            mediaType === 'video' && (
              <div className="space-y-3">
                <div
                  className={`
                    relative
                    overflow-hidden
                    rounded-xl
                    ${
                      isDarkMode
                        ? 'bg-zinc-950'
                        : 'bg-black'
                    }
                  `}
                >
                  <video
                    src={mediaPreview}
                    controls
                    playsInline
                    preload="metadata"
                    className="max-h-[550px] w-full object-contain"
                    onError={() => {
                      toast.error(
                        'Your browser cannot preview this video format.'
                      );
                    }}
                  >
                    Your browser does not support video
                    playback.
                  </video>

                  <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/65 px-3 py-1.5 text-xs text-white">
                    <Video className="h-3.5 w-3.5" />
                    Video
                  </div>
                </div>

                <p
                  className={`
                    text-xs
                    ${
                      isDarkMode
                        ? 'text-zinc-400'
                        : 'text-gray-500'
                    }
                  `}
                >
                  Review the complete video before
                  publishing.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading || processingMedia}
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Replace
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    disabled={loading || processingMedia}
                    onClick={clearSelectedMedia}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            )}

          {mediaPreview && !isEditing && (
            <Button
              type="button"
              disabled={
                loading ||
                processingMedia ||
                !selectedFile
              }
              onClick={createPostHandler}
              className="
                h-11
                w-full
                bg-[#0095F6]
                font-semibold
                text-white
                hover:bg-[#1877d2]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing post...
                </>
              ) : (
                'Share Post'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}