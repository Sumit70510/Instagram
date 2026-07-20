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
} from 'lucide-react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from './ui/avatar.jsx';

import { Button } from './ui/button.jsx';
import { Textarea } from './ui/textarea.jsx';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.jsx';

import { toast } from 'sonner';

import api from '@/Lib/api.js';
import {
  setAuthUser,
  setUserProfile,
} from '@/Redux/authslice.js';

const MAX_IMAGE_SIZE = 15 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
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

const getRotatedImageSize = (
  width,
  height,
  rotation
) => {
  const rotationRadians =
    getRadianAngle(rotation);

  return {
    width:
      Math.abs(
        Math.cos(rotationRadians) * width
      ) +
      Math.abs(
        Math.sin(rotationRadians) * height
      ),

    height:
      Math.abs(
        Math.sin(rotationRadians) * width
      ) +
      Math.abs(
        Math.cos(rotationRadians) * height
      ),
  };
};

const createCroppedImageFile = async ({
  imageSource,
  pixelCrop,
  rotation,
  fileName,
}) => {
  const image =
    await createImageElement(imageSource);

  const canvas =
    document.createElement('canvas');

  const canvasContext =
    canvas.getContext('2d');

  if (!canvasContext) {
    throw new Error(
      'Image editing is not supported by this browser.'
    );
  }

  const rotationRadians =
    getRadianAngle(rotation);

  const rotatedSize = getRotatedImageSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = Math.ceil(
    rotatedSize.width
  );

  canvas.height = Math.ceil(
    rotatedSize.height
  );

  canvasContext.translate(
    canvas.width / 2,
    canvas.height / 2
  );

  canvasContext.rotate(rotationRadians);

  canvasContext.translate(
    -image.width / 2,
    -image.height / 2
  );

  canvasContext.drawImage(
    image,
    0,
    0
  );

  const croppedCanvas =
    document.createElement('canvas');

  const croppedContext =
    croppedCanvas.getContext('2d');

  if (!croppedContext) {
    throw new Error(
      'Image cropping is not supported.'
    );
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

  const blob = await new Promise(
    (resolve, reject) => {
      croppedCanvas.toBlob(
        (generatedBlob) => {
          if (!generatedBlob) {
            reject(
              new Error(
                'Failed to create the cropped image.'
              )
            );

            return;
          }

          resolve(generatedBlob);
        },
        'image/jpeg',
        0.92
      );
    }
  );

  const cleanFileName =
    fileName?.replace(/\.[^/.]+$/, '') ||
    'profile-picture';

  return new File(
    [blob],
    `${cleanFileName}-edited.jpg`,
    {
      type: 'image/jpeg',
      lastModified: Date.now(),
    }
  );
};

export default function EditProfile() {
  const { user } = useSelector(
    (store) => store.auth
  );

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const imageRef = useRef(null);

  const [loading, setLoading] =
    useState(false);

  const [
    processingImage,
    setProcessingImage,
  ] = useState(false);

  const [input, setInput] = useState({
    profilePicture: null,
    bio: user?.bio || '',
    gender: user?.gender || '',
  });

  const [
    originalSelectedFile,
    setOriginalSelectedFile,
  ] = useState(null);

  const [
    selectedImageFile,
    setSelectedImageFile,
  ] = useState(null);

  const [
    imagePreview,
    setImagePreview,
  ] = useState(
    user?.profilePicture || ''
  );

  const [
    originalPreview,
    setOriginalPreview,
  ] = useState('');

  const [isEditing, setIsEditing] =
    useState(false);

  const [cropPosition, setCropPosition] =
    useState({
      x: 0,
      y: 0,
    });

  const [
    croppedAreaPixels,
    setCroppedAreaPixels,
  ] = useState(null);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] =
    useState(0);

  const [isMobile, setIsMobile] =
    useState(window.innerWidth < 690);

  useEffect(() => {
    setInput({
      profilePicture: null,
      bio: user?.bio || '',
      gender: user?.gender || '',
    });

    if (!selectedImageFile) {
      setImagePreview(
        user?.profilePicture || ''
      );
    }
  }, [user, selectedImageFile]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth < 690
      );
    };

    window.addEventListener(
      'resize',
      handleResize
    );

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      );
    };
  }, []);

  useEffect(() => {
    return () => {
      if (
        imagePreview?.startsWith('blob:')
      ) {
        URL.revokeObjectURL(
          imagePreview
        );
      }

      if (
        originalPreview?.startsWith(
          'blob:'
        )
      ) {
        URL.revokeObjectURL(
          originalPreview
        );
      }
    };
  }, [imagePreview, originalPreview]);

  const resetEditorValues = () => {
    setCropPosition({
      x: 0,
      y: 0,
    });

    setCroppedAreaPixels(null);
    setZoom(1);
    setRotation(0);
  };

  const revokeBlobUrl = (url) => {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const createPreviewUrl = (
    file,
    currentUrl
  ) => {
    revokeBlobUrl(currentUrl);

    return URL.createObjectURL(file);
  };

  const isHeicFile = (file) => {
    const fileName =
      file.name.toLowerCase();

    const fileType =
      file.type.toLowerCase();

    return (
      fileType.includes('heic') ||
      fileType.includes('heif') ||
      fileName.endsWith('.heic') ||
      fileName.endsWith('.heif')
    );
  };

  const isValidImageFile = (file) => {
    const fileName =
      file.name.toLowerCase();

    const fileType =
      file.type.toLowerCase();

    return (
      fileType.startsWith('image/') ||
      ALLOWED_IMAGE_TYPES.includes(
        fileType
      ) ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      fileName.endsWith('.png') ||
      fileName.endsWith('.webp') ||
      fileName.endsWith('.heic') ||
      fileName.endsWith('.heif')
    );
  };

  const validateImage = (file) => {
    if (!isValidImageFile(file)) {
      toast.error(
        'Please select a JPG, PNG, WebP, HEIC, or HEIF image.'
      );

      return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(
        'The image must be smaller than 15 MB.'
      );

      return false;
    }

    return true;
  };

  const convertHeicToJpeg = async (
    file
  ) => {
    const convertedResult =
      await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.92,
      });

    const convertedBlob =
      Array.isArray(convertedResult)
        ? convertedResult[0]
        : convertedResult;

    const convertedFileName =
      file.name.replace(
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

  const fileChangeHandler = async (
    event
  ) => {
    const uploadedFile =
      event?.target?.files?.[0];

    if (!uploadedFile) {
      return;
    }

    if (!validateImage(uploadedFile)) {
      event.target.value = '';
      return;
    }

    try {
      setProcessingImage(true);

      let processedFile =
        uploadedFile;

      if (isHeicFile(uploadedFile)) {
        toast.info(
          'Converting HEIC image...'
        );

        processedFile =
          await convertHeicToJpeg(
            uploadedFile
          );
      }

      revokeBlobUrl(imagePreview);
      revokeBlobUrl(originalPreview);

      const previewUrl =
        URL.createObjectURL(
          processedFile
        );

      setOriginalSelectedFile(
        processedFile
      );

      setSelectedImageFile(
        processedFile
      );

      setOriginalPreview(previewUrl);
      setImagePreview(previewUrl);

      setInput((currentInput) => ({
        ...currentInput,
        profilePicture:
          processedFile,
      }));

      resetEditorValues();
      setIsEditing(true);

      toast.success(
        'Image selected. Adjust the crop before saving.'
      );
    } catch (error) {
      console.error(
        'Profile image processing error:',
        error
      );

      toast.error(
        'The selected image could not be processed.'
      );
    } finally {
      setProcessingImage(false);
    }
  };

  const cropCompleteHandler =
    useCallback(
      (
        _croppedArea,
        croppedPixels
      ) => {
        setCroppedAreaPixels(
          croppedPixels
        );
      },
      []
    );

  const applyCropHandler = async () => {
    if (
      !imagePreview ||
      !croppedAreaPixels ||
      !selectedImageFile
    ) {
      toast.error(
        'Crop information is unavailable.'
      );

      return;
    }

    try {
      setProcessingImage(true);

      const croppedFile =
        await createCroppedImageFile({
          imageSource: imagePreview,
          pixelCrop:
            croppedAreaPixels,
          rotation,
          fileName:
            selectedImageFile.name,
        });

      const nextPreview =
        createPreviewUrl(
          croppedFile,
          imagePreview
        );

      setSelectedImageFile(
        croppedFile
      );

      setImagePreview(nextPreview);

      setInput((currentInput) => ({
        ...currentInput,
        profilePicture:
          croppedFile,
      }));

      resetEditorValues();
      setIsEditing(false);

      toast.success(
        'Profile photo changes applied.'
      );
    } catch (error) {
      console.error(
        'Profile image crop error:',
        error
      );

      toast.error(
        error?.message ||
          'Failed to edit the image.'
      );
    } finally {
      setProcessingImage(false);
    }
  };

  const cancelCropHandler = () => {
    resetEditorValues();
    setIsEditing(false);
  };

  const editAgainHandler = () => {
    resetEditorValues();
    setIsEditing(true);
  };

  const restoreOriginalHandler = () => {
    if (!originalSelectedFile) {
      return;
    }

    const nextPreview =
      createPreviewUrl(
        originalSelectedFile,
        imagePreview
      );

    setSelectedImageFile(
      originalSelectedFile
    );

    setImagePreview(nextPreview);

    setInput((currentInput) => ({
      ...currentInput,
      profilePicture:
        originalSelectedFile,
    }));

    resetEditorValues();
    setIsEditing(true);

    toast.success(
      'Original selected image restored.'
    );
  };

  const removeSelectedImageHandler =
    () => {
      revokeBlobUrl(imagePreview);
      revokeBlobUrl(originalPreview);

      setOriginalSelectedFile(null);
      setSelectedImageFile(null);
      setOriginalPreview('');

      setImagePreview(
        user?.profilePicture || ''
      );

      setInput((currentInput) => ({
        ...currentInput,
        profilePicture: null,
      }));

      resetEditorValues();
      setIsEditing(false);

      if (imageRef.current) {
        imageRef.current.value = '';
      }
    };

  const rotateLeftHandler = () => {
    setRotation(
      (currentRotation) =>
        currentRotation - 90
    );
  };

  const rotateRightHandler = () => {
    setRotation(
      (currentRotation) =>
        currentRotation + 90
    );
  };

  const selectChangeHandler = (
    value
  ) => {
    setInput((currentInput) => ({
      ...currentInput,
      gender: value,
    }));
  };

  const editProfileHandler = async () => {
    if (
      loading ||
      processingImage
    ) {
      return;
    }

    if (isEditing) {
      toast.error(
        'Please apply or cancel your image edits first.'
      );

      return;
    }

    const formData = new FormData();

    formData.append(
      'bio',
      input.bio?.trim() || ''
    );

    formData.append(
      'gender',
      input.gender || ''
    );

    if (selectedImageFile) {
      formData.append(
        'profilePicture',
        selectedImageFile
      );
    }

    try {
      setLoading(true);

      const response =
        await api.post(
          '/user/profile/edit',
          formData
        );

      if (response.data?.success) {
        const returnedUser =
          response.data.user;

        const updatedUserData = {
          ...user,
          bio:
            returnedUser?.bio ??
            input.bio,
          profilePicture:
            returnedUser
              ?.profilePicture ??
            user?.profilePicture,
          gender:
            returnedUser?.gender ??
            input.gender,
        };

        dispatch(
          setAuthUser(
            updatedUserData
          )
        );

        dispatch(
          setUserProfile(
            updatedUserData
          )
        );

        toast.success(
          response.data.message ||
            'Profile updated successfully.'
        );

        navigate(
          `/profile/${user?._id}`
        );
      } else {
        toast.error(
          response.data?.message ||
            'The profile could not be updated.'
        );
      }
    } catch (error) {
      console.error(
        'Edit profile error:',
        error
      );

      toast.error(
        error?.response?.data
          ?.message ||
          'Failed to update your profile.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`
        mx-auto
        flex
        w-full
        max-w-2xl
        ${
          isMobile
            ? 'p-3'
            : 'px-6'
        }
      `}
    >
      <section className="my-8 flex w-full flex-col gap-6">
        <h1 className="text-xl font-bold">
          Edit Profile
        </h1>

        <div className="space-y-4 rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 text-black">
              <AvatarImage
                src={
                  imagePreview ||
                  user?.profilePicture
                }
                alt={
                  user?.username ||
                  'Profile image'
                }
              />

              <AvatarFallback>
                {user?.username
                  ?.slice(0, 2)
                  ?.toUpperCase() ||
                  'US'}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold">
                {user?.username}
              </h2>

              <span className="line-clamp-1 text-sm text-gray-500">
                {input.bio ||
                  'Bio Here'}
              </span>
            </div>
          </div>

          <input
            ref={imageRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={
              fileChangeHandler
            }
          />

          {!selectedImageFile && (
            <button
              type="button"
              disabled={
                processingImage ||
                loading
              }
              onClick={() => {
                imageRef.current?.click();
              }}
              className="
                flex
                min-h-48
                w-full
                flex-col
                items-center
                justify-center
                gap-3
                rounded-xl
                border-2
                border-dashed
                border-gray-300
                bg-gray-50
                px-4
                transition
                hover:border-gray-400
                hover:bg-gray-100
                dark:border-zinc-700
                dark:bg-zinc-950
                dark:hover:border-zinc-500
                dark:hover:bg-zinc-900
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {processingImage ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin" />

                  <p className="text-sm font-medium">
                    Processing image...
                  </p>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-gray-200 p-3 dark:bg-zinc-800">
                    <Upload className="h-6 w-6" />
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-semibold">
                      Choose a new photo
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      JPG, PNG, WebP, HEIC
                      up to 15 MB
                    </p>
                  </div>
                </>
              )}
            </button>
          )}

          {selectedImageFile &&
            isEditing && (
              <div className="space-y-4">
                <div className="relative h-[380px] w-full overflow-hidden rounded-xl bg-black">
                  <Cropper
                    image={imagePreview}
                    crop={cropPosition}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    objectFit="contain"
                    onCropChange={
                      setCropPosition
                    }
                    onCropComplete={
                      cropCompleteHandler
                    }
                    onZoomChange={
                      setZoom
                    }
                  />
                </div>

                <p className="text-center text-xs text-gray-500">
                  The circular guide shows
                  how your profile picture
                  will appear.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="profile-zoom"
                      className="text-sm font-medium"
                    >
                      Zoom
                    </label>

                    <span className="text-xs text-gray-500">
                      {zoom.toFixed(1)}×
                    </span>
                  </div>

                  <input
                    id="profile-zoom"
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(
                      event
                    ) => {
                      setZoom(
                        Number(
                          event.target
                            .value
                        )
                      );
                    }}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="profile-rotation"
                      className="text-sm font-medium"
                    >
                      Rotation
                    </label>

                    <span className="text-xs text-gray-500">
                      {rotation}°
                    </span>
                  </div>

                  <input
                    id="profile-rotation"
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={rotation}
                    onChange={(
                      event
                    ) => {
                      setRotation(
                        Number(
                          event.target
                            .value
                        )
                      );
                    }}
                    className="w-full cursor-pointer"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={
                        rotateLeftHandler
                      }
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Rotate left
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={
                        rotateRightHandler
                      }
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
                    disabled={
                      processingImage
                    }
                    onClick={
                      cancelCropHandler
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    disabled={
                      processingImage
                    }
                    onClick={
                      applyCropHandler
                    }
                    className="bg-[#0095F6] text-white hover:bg-[#1877d2]"
                  >
                    {processingImage ? (
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

          {selectedImageFile &&
            !isEditing && (
              <div className="space-y-3">
                <div className="relative flex min-h-72 w-full items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-zinc-950">
                  <img
                    src={imagePreview}
                    alt="Edited profile preview"
                    className="max-h-[500px] w-full object-contain"
                  />

                  <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/65 px-3 py-1.5 text-xs text-white">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Profile photo
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      loading ||
                      processingImage
                    }
                    onClick={
                      editAgainHandler
                    }
                  >
                    <Crop className="mr-2 h-4 w-4" />
                    Edit
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      loading ||
                      processingImage
                    }
                    onClick={
                      restoreOriginalHandler
                    }
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Original
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      loading ||
                      processingImage
                    }
                    onClick={() => {
                      imageRef.current?.click();
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Replace
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    disabled={
                      loading ||
                      processingImage
                    }
                    onClick={
                      removeSelectedImageHandler
                    }
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            )}

          {!selectedImageFile && (
            <Button
              type="button"
              disabled={
                processingImage ||
                loading
              }
              onClick={() => {
                imageRef.current?.click();
              }}
              className="h-9 w-full bg-[#0095F6] hover:bg-[#318bc7]"
            >
              Change Photo
            </Button>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              Bio
            </h2>

            <span className="text-xs text-gray-500">
              {input.bio.length}/150
            </span>
          </div>

          <Textarea
            name="bio"
            value={input.bio}
            maxLength={150}
            disabled={loading}
            placeholder="Write something about yourself..."
            className="min-h-28 resize-none focus-visible:ring-transparent"
            onChange={(event) => {
              setInput(
                (
                  currentInput
                ) => ({
                  ...currentInput,
                  bio:
                    event.target
                      .value,
                })
              );
            }}
          />
        </div>

        <div>
          <h2 className="mb-2 font-bold">
            Gender
          </h2>

          <Select
            value={input.gender}
            disabled={loading}
            onValueChange={
              selectChangeHandler
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectItem value="male">
                  Male
                </SelectItem>

                <SelectItem value="female">
                  Female
                </SelectItem>

                <SelectItem value="other">
                  Other
                </SelectItem>

                <SelectItem value="prefer-not-to-say">
                  Prefer not to say
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={
              loading ||
              processingImage ||
              isEditing
            }
            onClick={
              editProfileHandler
            }
            className="w-full bg-[#0095F6] hover:bg-[#2a8ccd] sm:w-fit"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving changes...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}