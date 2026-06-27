import React, { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import { 
  Camera, 
  Upload, 
  ArrowLeft, 
  Check, 
  Image as ImageIcon,
  RefreshCw,
  Wand2,
  Sliders,
  Footprints,
  ZoomIn,
  Tag,
  DollarSign,
  AlignLeft,
  Phone,
  Grid,
  MapPin
} from "lucide-react";
import { CATEGORIES } from "../types";
import { supabase } from "../lib/supabase";
import { uploadImage } from "../lib/supabase";

// Tool for client-side JPEG compression and image resizing
const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str.startsWith("data:image")) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
};

interface AnunciarScreenProps {
  userProfile?: any;
  onBack: () => void;
  onProductCreated?: (newProduct: any) => void;
}

export default function AnunciarScreen({ userProfile, onBack, onProductCreated }: AnunciarScreenProps) {
  const [uploadStep, setUploadStep] = useState<"media" | "details">("media");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [newProductImages, setNewProductImages] = useState<string[]>([]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductPhone, setNewProductPhone] = useState(userProfile?.phone || "+351 912 345 678");
  const [newProductCategory, setNewProductCategory] = useState(CATEGORIES[0].id);
  const [newProductSubcategory, setNewProductSubcategory] = useState(CATEGORIES[0].subcategories[0]);
  const [newProductLocation, setNewProductLocation] = useState(userProfile?.location || "Lisboa");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync state if userProfile loaded asynchronously
  useEffect(() => {
    if (userProfile?.phone) {
      setNewProductPhone(userProfile.phone);
    }
    if (userProfile?.location) {
      setNewProductLocation(userProfile.location);
    }
  }, [userProfile]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedFields, setExpandedFields] = useState<{ [key: string]: boolean }>({
    title: true,
    price: false,
    desc: false,
    phone: false,
    category: false,
    location: false,
  });

  const selectedCategory = CATEGORIES.find(c => c.id === newProductCategory) || CATEGORIES[0];

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    setNewProductCategory(catId);
    const cat = CATEGORIES.find(c => c.id === catId);
    setNewProductSubcategory(cat?.subcategories[0] || "");
  };

  const toggleField = (field: string) => {
    setExpandedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Real Hardware Device Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  // Camera Interactive Filter States
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showSneakerOverlay, setShowSneakerOverlay] = useState<boolean>(false);
  const [exposureMode, setExposureMode] = useState<"natural" | "vivid" | "studio">("natural");
  const [beautyOn, setBeautyOn] = useState<boolean>(false);

  // Manage Real Device Camera stream lifecycle
  useEffect(() => {
    if (uploadStep === "media") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [uploadStep, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("API de média não suportada pelo navegador atual");
      }
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1080 }
        },
        audio: false
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn("Erro ao iniciar câmera de hardware:", err);
      setCameraError("Acesso à câmera física indisponível no momento");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleOpenGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process selected files from Device Gallery load
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFiles = Array.from(files);
      const loadedUrls: string[] = [];
      let processed = 0;

      selectedFiles.forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = async () => {
          if (reader.result) {
            try {
              const compressed = await compressImage(reader.result as string);
              loadedUrls.push(compressed);
            } catch (err) {
              console.error("Erro ao comprimir imagem:", err);
              loadedUrls.push(reader.result as string);
            }
            processed++;
            if (processed === selectedFiles.length) {
              setCapturedImage(loadedUrls[0]);
              setNewProductImages(loadedUrls);
              setUploadStep("details");
              stopCamera();
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Capture still image frame from HTML5 streaming video
  const handleCaptureRealPhoto = () => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1080;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (facingMode === "user") {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }

        // Apply active filter configurations to canvas rendering
        let filtersStr = "";
        if (beautyOn) {
          filtersStr += "contrast(1.1) brightness(1.04) saturate(1.15) blur(0.5px) ";
        }
        if (exposureMode === "vivid") {
          filtersStr += "saturate(1.4) contrast(1.15) ";
        } else if (exposureMode === "studio") {
          filtersStr += "brightness(1.15) contrast(1.05) ";
        }

        if (filtersStr.trim()) {
          ctx.filter = filtersStr.trim();
        }

        // Crop the video center if zoom is applied
        if (zoomLevel > 1) {
          const sWidth = video.videoWidth / zoomLevel;
          const sHeight = video.videoHeight / zoomLevel;
          const sx = (video.videoWidth - sWidth) / 2;
          const sy = (video.videoHeight - sHeight) / 2;
          ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        compressImage(dataUrl, 800, 800, 0.7).then((compressed) => {
          setCapturedImage(compressed);
          setNewProductImages([compressed]);
          setUploadStep("details");
          stopCamera();
        });
      }
    } else {
      // High resolution elegant prototype fallback
      const simulatedPhotos = [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80"
      ];
      const picked = simulatedPhotos[Math.floor(Math.random() * simulatedPhotos.length)];
      setCapturedImage(picked);
      setNewProductImages([picked]);
      setUploadStep("details");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || loading) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert("Sua sessão expirou ou você não está logado. Por favor, faça login novamente.");
        setLoading(false);
        return;
      }
      
      const uid = user.id;

      // Upload main image if it's base64
      let finalCapturedImage = capturedImage;
      if (capturedImage && capturedImage.startsWith("data:image")) {
        try {
          finalCapturedImage = await uploadImage(capturedImage, 'images', `products/${uid}`);
        } catch (uploadErr: any) {
          console.error("Erro no upload da imagem principal:", uploadErr);
          if (uploadErr.message?.includes("bucket")) {
            alert(uploadErr.message);
            setLoading(false);
            return;
          }
        }
      }

      // Upload gallery images if they are base64
      const finalGalleryImages = await Promise.all(
        newProductImages.map(async (img) => {
          if (img && img.startsWith("data:image")) {
            try {
              return await uploadImage(img, 'images', `products/${uid}`);
            } catch (err: any) {
              console.error("Erro no upload da galeria:", err);
              if (err.message?.includes("bucket")) {
                throw err; // Re-throw to be caught by the outer catch
              }
              return img;
            }
          }
          return img;
        })
      );

      // Extrai apenas o valor numérico do preço para salvar na coluna numeric do banco
      const numericPrice = parseFloat(newProductPrice.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;

      const newProductData = {
        seller_id: uid,
        name: newProductName,
        price: numericPrice,
        description: newProductDesc || "Nenhuma descrição detalhada fornecida pelo vendedor.",
        image_url: finalCapturedImage || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
        images: finalGalleryImages.length > 0 ? finalGalleryImages : [finalCapturedImage || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"],
        category: selectedCategory.name,
        subcategory: newProductSubcategory,
        views: 0,
        location: newProductLocation.trim() || userProfile?.location || "Lisboa"
      };

      const { data, error } = await supabase
        .from('products')
        .insert(newProductData)
        .select()
        .single();

      if (error) throw error;

      setIsSubmitted(true);
      setLoading(false);

      if (onProductCreated && data) {
        onProductCreated(data);
      }

      setTimeout(() => {
        if (!onProductCreated) {
          onBack();
        }
        setIsSubmitted(false);
        setUploadStep("media");
        setCapturedImage(null);
        setNewProductImages([]);
        setNewProductName("");
        setNewProductPrice("");
        setNewProductDesc("");
        setNewProductCategory(CATEGORIES[0].id);
        setNewProductLocation("Lisboa");
      }, 1000);
    } catch (error) {
      console.error("Error adding product to Supabase:", error);
      setLoading(false);
      alert("Erro ao publicar anúncio. Tente novamente.");
    }
  };


  return (
    <div className="w-full flex flex-col min-h-screen bg-zinc-950 text-white select-none">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        multiple
        className="hidden" 
      />

      {isSubmitted ? (
        /* Success screen - max 8px spacing */
        <div className="flex-1 flex flex-col items-center justify-center p-[16px] text-center gap-[8px] animate-fade-in bg-zinc-950">
          <div className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center text-black">
            <Check className="w-6 h-6 text-black" strokeWidth={3.5} />
          </div>
          <h4 className="font-chivo text-[18px] font-black text-white">
            Anúncio publicado com sucesso
          </h4>
          <p className="text-[12px] text-zinc-400 max-w-[280px]">
            O seu produto já está disponível no feed principal para os compradores autónomos.
          </p>
        </div>
      ) : uploadStep === "media" ? (
        /* IMMERSIVE NATIVE FULL-SCREEN CAMERA VIEW */
        <div className="fixed inset-0 z-[100] bg-black flex flex-col justify-between overflow-hidden animate-fade-in w-full h-full">
          
          {/* Transparent Floating Glass Top Toolbar */}
          <div className="absolute top-0 left-0 right-0 p-[8px] bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-50">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-[5px] text-white hover:text-zinc-300 text-[13px] bg-black/40 backdrop-blur-md px-[12px] py-[8px] rounded-full border-none cursor-pointer font-bold leading-none active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            
            <div className="bg-black/40 backdrop-blur-md px-[12px] py-[8px] rounded-full flex items-center gap-[6px]">
              <span className={`w-2 h-2 rounded-full ${stream ? "bg-emerald-500 animate-pulse" : "bg-neutral-500"}`} />
              <span className="text-[10px] font-bold text-white tracking-wider">
                {stream ? "Dispositivo online" : "Simulador ativo"}
              </span>
            </div>

            {stream && (
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 flex items-center justify-center text-white cursor-pointer border-none active:scale-95 transition-all"
                title="Inverter câmara"
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </button>
            )}
          </div>

          {/* Core Full Viewfinder Canvas (Device Wide Camera stream) */}
          <div className="relative w-full h-full bg-zinc-950 overflow-hidden flex items-center justify-center">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ 
                  transform: `${facingMode === "user" ? "scaleX(-1)" : ""} scale(${zoomLevel})`,
                  filter: `${beautyOn ? 'contrast(1.1) brightness(1.04) saturate(1.15) blur(0.3px)' : ''} ${exposureMode === 'vivid' ? 'saturate(1.4) contrast(1.15)' : exposureMode === 'studio' ? 'brightness(1.15) contrast(1.05)' : ''}`,
                  transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s ease"
                }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-[8px] text-center p-[24px]">
                <Camera className="w-[48px] h-[48px] text-zinc-500 animate-pulse" />
                <span className="text-[14px] font-black text-white">
                  Câmara indisponível no momento
                </span>
                <span className="text-[11px] text-zinc-400 max-w-xs leading-normal">
                  {cameraError ? cameraError : "Conceda permissão nas configurações para câmera real"}
                </span>
              </div>
            )}

            {/* Tactical Sneaker Align overlay frame */}
            {showSneakerOverlay && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-25 animate-pulse select-none bg-black/10">
                <svg className="w-[220px] h-[220px] text-white opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 18h18M11 6h4l2 3h3l2 4-1 4H6l-3-4 1-5 2-1h5" strokeDasharray="1 1" />
                  <circle cx="7" cy="18" r="1.5" />
                  <circle cx="17" cy="18" r="1.5" />
                  <path d="M12 11h2M11 14h4" />
                </svg>
                <div className="absolute top-[32%] bg-black/60 px-[10px] py-[4px] rounded-full text-[9px] font-bold tracking-widest text-[#93c5fd] uppercase">
                  Alinhador de sapatilhas
                </div>
              </div>
            )}

            {/* Beautiful Floating Interactive Right Sidebar - strict 8px separation constraint */}
            <div className="absolute right-[12px] top-1/2 -translate-y-1/2 flex flex-col gap-[8px] z-30 select-none bg-neutral-800/90 backdrop-blur-md p-[8px] rounded-full border border-neutral-700 shadow-xl">
              
              {/* 1. Pull (Zoom Toggle) */}
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1))}
                className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-white cursor-pointer transition-all border border-neutral-650 active:scale-90 ${zoomLevel > 1 ? 'bg-white text-black border-white' : 'bg-neutral-900 hover:bg-neutral-850'}`}
                title={`Puxar zoom: ${zoomLevel}x`}
              >
                <ZoomIn className={`w-5 h-5 ${zoomLevel > 1 ? 'text-black' : 'text-white'}`} strokeWidth={3} />
              </button>

              {/* 2. Sneakers Guide sticker overlay toggle */}
              <button
                type="button"
                onClick={() => setShowSneakerOverlay((prev) => !prev)}
                className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-white cursor-pointer transition-all border border-neutral-650 active:scale-90 ${showSneakerOverlay ? 'bg-white text-black border-white' : 'bg-neutral-900 hover:bg-neutral-850'}`}
                title="Guia de sapatilhas"
              >
                <Footprints className={`w-5 h-5 ${showSneakerOverlay ? 'text-black' : 'text-white'}`} strokeWidth={3} />
              </button>

              {/* 3. Photos edit / slider filter mode */}
              <button
                type="button"
                onClick={() => setExposureMode((prev) => prev === "natural" ? "vivid" : prev === "vivid" ? "studio" : "natural")}
                className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-white cursor-pointer transition-all border border-neutral-650 active:scale-90 ${exposureMode !== "natural" ? 'bg-white text-black border-white' : 'bg-neutral-900 hover:bg-neutral-850'}`}
                title={`Exposição: ${exposureMode}`}
              >
                <Sliders className={`w-5 h-5 ${exposureMode !== "natural" ? 'text-black' : 'text-white'}`} strokeWidth={3} />
              </button>

              {/* 4. Beauty Filter soft blur & skin glow mode */}
              <button
                type="button"
                onClick={() => setBeautyOn((prev) => !prev)}
                className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-white cursor-pointer transition-all border border-neutral-650 active:scale-90 ${beautyOn ? 'bg-white text-black border-white' : 'bg-neutral-900 hover:bg-neutral-850'}`}
                title="Filtro beleza"
              >
                <Wand2 className={`w-5 h-5 ${beautyOn ? 'text-black' : 'text-white'}`} strokeWidth={3} />
              </button>

            </div>

            {/* Tactical Grid Brackets overlay for precision framing */}
            <div className="absolute inset-[32px] pointer-events-none z-10 opacity-30">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white" />
              
              {/* Subtle crosshair in the center */}
              <div className="absolute top-1/2 left-1/2 w-4 h-[1px] bg-white -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 h-4 w-[1px] bg-white -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Immersive Dark Bottom Panel with control tools - max 8px spacing */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-[16px] pb-[32px] flex flex-col gap-[8px] items-center z-50">
            
            {/* Primary camera actions toolbar */}
            <div className="flex items-center justify-between w-full max-w-xs px-[8px]">
              {/* Gallery upload preview circle */}
              <div className="flex flex-col items-center gap-[4px]">
                <button
                  type="button"
                  onClick={handleOpenGallery}
                  className="w-[44px] h-[44px] rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-all"
                  title="Abrir galeria"
                >
                  <ImageIcon className="w-5 h-5 text-zinc-200" />
                </button>
                <span className="text-[10px] font-bold text-zinc-350">
                  Galeria
                </span>
              </div>

              {/* Giant circular white tactile shutter button */}
              <button
                type="button"
                onClick={handleCaptureRealPhoto}
                className="w-[72px] h-[72px] rounded-full border-[4px] border-white bg-white/20 backdrop-blur-sm flex items-center justify-center hover:scale-105 active:scale-90 transition-all cursor-pointer shadow-lg"
                title="Tirar foto"
              >
                <div className="w-[52px] h-[52px] rounded-full bg-white transition-all active:bg-zinc-200" />
              </button>

              {/* Switch camera shortcut option */}
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="w-[44px] h-[44px] rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-all"
                title="Inverter câmera"
              >
                <RefreshCw className="w-5 h-5 text-zinc-200" />
              </button>
            </div>

            <span className="text-[11px] text-zinc-400 font-medium">
              Toque no botão central para capturar instantaneamente
            </span>
          </div>
        </div>
      ) : (
        /* EDIT FORM FIELDS - transparent, no borders, bold white icons, photos left, title right */
        <div className="w-full max-w-md mx-auto p-[8px] bg-transparent flex flex-col gap-[8px] animate-fade-in font-sans">
          
          <div className="flex items-center justify-between pb-[12px] bg-transparent">
            <button
              type="button"
              onClick={() => setUploadStep("media")}
              className="flex items-center gap-[6px] text-white hover:text-neutral-200 text-[15px] bg-transparent border-none cursor-pointer leading-none active:scale-95 transition-all font-normal"
            >
              <ArrowLeft className="w-5 h-5 text-white shrink-0" strokeWidth={4} />
              <span className="text-white select-none leading-none tracking-wide font-bold">Subir novo</span>
            </button>
            <button
              type="submit"
              form="upload-form"
              className="bg-white hover:bg-zinc-100 text-black py-[6px] px-[16px] rounded-full text-[13.5px] transition-all hover:scale-[1.02] active:scale-[0.95] cursor-pointer flex items-center justify-center border-none font-bold text-zinc-950"
            >
              Subir
            </button>
          </div>

          <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-[8px] w-full bg-transparent">
            {/* Top row: Left (Photos) & Right (Title) */}
            <div className="flex items-center gap-[12px] w-full bg-transparent">
              {/* Left: Photos 100px height */}
              <div className="relative w-[100px] h-[100px] shrink-0 rounded-[8px] overflow-hidden bg-transparent">
                <img
                  src={capturedImage || ""}
                  alt="Foto do produto"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-[8px]"
                />
              </div>

              {/* Right: Product Title option with clean design & white icon */}
              <div 
                onClick={() => toggleField("title")}
                className="flex-1 flex flex-col gap-[4px] justify-center bg-transparent cursor-pointer"
              >
                <div className="flex items-center gap-[8px] shrink-0">
                  <Tag className="w-[20px] h-[20px] text-white shrink-0" strokeWidth={2.5} />
                  <span className="leading-none text-white text-[17px] font-normal">
                    Título do produto
                  </span>
                </div>
                {expandedFields.title && (
                  <div className="w-full flex flex-col gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
                    {newProductName.trim() === "" && (
                      <span className="text-[11px] text-zinc-500 font-medium italic select-none">
                        Exemplo: Sapatilhas Nike Air Force 1 - Praticamente Novas
                      </span>
                    )}
                    <input
                      type="text"
                      required
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="Introduza o título do artigo"
                      className="w-full bg-transparent border-b border-zinc-800 focus:border-white text-white text-[15px] focus:outline-none pb-1 font-normal transition-colors duration-200"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Other options below - strictly no backgrounds or lines, with clean design & white icons */}
            <div 
              onClick={() => toggleField("price")}
              className="flex flex-col gap-[4px] w-full bg-transparent cursor-pointer pt-[4px]"
            >
              <div className="flex items-center gap-[8px] shrink-0">
                <DollarSign className="w-[20px] h-[20px] text-white shrink-0" strokeWidth={2.5} />
                <span className="leading-none text-white text-[17px] font-normal">
                  Preço do produto
                </span>
              </div>
              {expandedFields.price && (
                <div className="w-full flex flex-col gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
                  {newProductPrice.trim() === "" && (
                    <span className="text-[11px] text-zinc-500 font-medium italic select-none">
                      Exemplo: 85 MT ou 450 MT
                    </span>
                  )}
                  <input
                    type="text"
                    required
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="Introduza o preço de venda"
                    className="w-full bg-transparent border-b border-zinc-800 focus:border-white text-white text-[15px] focus:outline-none pb-1 font-normal transition-colors duration-200"
                  />
                </div>
              )}
            </div>

            <div 
              onClick={() => toggleField("desc")}
              className="flex flex-col gap-[4px] w-full bg-transparent cursor-pointer pt-[4px]"
            >
              <div className="flex items-center gap-[8px] shrink-0">
                <AlignLeft className="w-[20px] h-[20px] text-white shrink-0" strokeWidth={2.5} />
                <span className="leading-none text-white text-[17px] font-normal">
                  Descrição do produto
                </span>
              </div>
              {expandedFields.desc && (
                <div className="w-full flex flex-col gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
                  {newProductDesc.trim() === "" && (
                    <span className="text-[11px] text-zinc-500 font-medium italic select-none">
                      Exemplo: Tamanho 41, pouquíssimo uso, acompanha caixa original e atacadores extra.
                    </span>
                  )}
                  <textarea
                    value={newProductDesc}
                    onChange={(e) => setNewProductDesc(e.target.value)}
                    placeholder="Escreva detalhes adicionais..."
                    rows={2}
                    className="w-full bg-transparent border-b border-zinc-800 focus:border-white text-white text-[15px] focus:outline-none pb-1 resize-none font-normal transition-colors duration-200"
                  />
                </div>
              )}
            </div>

            <div 
              onClick={() => toggleField("category")}
              className="flex flex-col gap-[4px] w-full bg-transparent cursor-pointer pt-[4px]"
            >
              <div className="flex items-center gap-[8px] shrink-0">
                <Grid className="w-[20px] h-[20px] text-white shrink-0" strokeWidth={2.5} />
                <span className="leading-none text-white text-[17px] font-normal">
                  Categoria
                </span>
              </div>
              {expandedFields.category && (
                <div className="w-full flex flex-col gap-2 mt-1.5" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[11px] text-zinc-500 font-medium italic select-none">
                    Dica: Escolha a categoria correta para facilitar as buscas digitais.
                  </span>
                  <div className="flex flex-col gap-[8px] border-b border-zinc-800 pb-2">
                    <select
                      required
                      value={newProductCategory}
                      onChange={handleCategoryChange}
                      className="w-full bg-zinc-900/60 border border-zinc-800 text-white text-[15px] focus:outline-none p-2.5 rounded-[8px] appearance-none cursor-pointer focus:border-white transition-colors duration-200"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id} className="text-black">{cat.name}</option>
                      ))}
                    </select>
                    <select
                      required
                      value={newProductSubcategory}
                      onChange={(e) => setNewProductSubcategory(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 text-white text-[15px] focus:outline-none p-2.5 rounded-[8px] appearance-none cursor-pointer focus:border-white transition-colors duration-200"
                    >
                      {selectedCategory.subcategories.map(sub => (
                        <option key={sub} value={sub} className="text-black">{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div 
              onClick={() => toggleField("location")}
              className="flex flex-col gap-[4px] w-full bg-transparent cursor-pointer pt-[4px]"
            >
              <div className="flex items-center gap-[8px] shrink-0">
                <MapPin className="w-[20px] h-[20px] text-white shrink-0" strokeWidth={2.5} />
                <span className="leading-none text-white text-[17px] font-normal">
                  Localização
                </span>
              </div>
              {expandedFields.location && (
                <div className="w-full flex flex-col gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
                  {newProductLocation.trim() === "" && (
                    <span className="text-[11px] text-zinc-500 font-medium italic select-none">
                      Exemplo: Lisboa, Porto ou São Paulo
                    </span>
                  )}
                  <input
                    type="text"
                    required
                    value={newProductLocation}
                    onChange={(e) => setNewProductLocation(e.target.value)}
                    placeholder="Introduza a cidade"
                    className="w-full bg-transparent border-b border-zinc-800 focus:border-white text-white text-[15px] focus:outline-none pb-1 font-normal transition-colors duration-200"
                  />
                </div>
              )}
            </div>

            <div 
              onClick={() => toggleField("phone")}
              className="flex flex-col gap-[4px] w-full bg-transparent cursor-pointer pt-[4px]"
            >
              <div className="flex items-center gap-[8px] shrink-0">
                <Phone className="w-[20px] h-[20px] text-white shrink-0" strokeWidth={2.5} />
                <span className="leading-none text-white text-[17px] font-normal">
                  Contacto do vendedor
                </span>
              </div>
              {expandedFields.phone && (
                <div className="w-full flex flex-col gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
                  {newProductPhone.trim() === "" && (
                    <span className="text-[11px] text-zinc-500 font-medium italic select-none">
                      Exemplo: +351 912 345 678 ou +55 11 99999-9999
                    </span>
                  )}
                  <input
                    type="text"
                    required
                    value={newProductPhone}
                    onChange={(e) => setNewProductPhone(e.target.value)}
                    placeholder="Introduza o contacto telefónico"
                    className="w-full bg-transparent border-b border-zinc-800 focus:border-white text-white text-[15px] focus:outline-none pb-1 font-normal transition-colors duration-200"
                  />
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
