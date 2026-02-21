import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Check, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeliveryProofUploadProps {
  orderId: string;
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeliveryProofUpload({
  orderId,
  orderNumber,
  isOpen,
  onClose,
  onSuccess,
}: DeliveryProofUploadProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
        audio: false,
      });
      
      setStream(mediaStream);
      setIsCameraMode(true);
      
      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraMode(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `delivery-${Date.now()}.jpg`, { type: "image/jpeg" });
            setPhotoFile(file);
            setPhoto(canvas.toDataURL("image/jpeg"));
            stopCamera();
          }
        }, "image/jpeg", 0.9);
      }
    }
  };

  // Handle file selection from gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload delivery proof
  const handleUpload = async () => {
    if (!photoFile) {
      toast.error("Silakan ambil foto bukti pengiriman");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `${orderId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("delivery-proofs")
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("delivery-proofs")
        .getPublicUrl(filePath);

      // Save delivery proof record
      const { error: insertError } = await supabase
        .from("delivery_proofs")
        .insert({
          order_id: orderId,
          photo_url: urlData.publicUrl,
          notes: notes || null,
        });

      if (insertError) throw insertError;

      // Update order status to delivered
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      toast.success("Bukti pengiriman berhasil diupload!");
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Gagal mengupload bukti pengiriman");
    } finally {
      setIsUploading(false);
    }
  };

  // Reset and close
  const handleClose = () => {
    stopCamera();
    setPhoto(null);
    setPhotoFile(null);
    setNotes("");
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={isCameraMode ? "sm:max-w-full h-screen p-0 m-0 rounded-none" : "sm:max-w-md"}>
        {!isCameraMode && (
          <DialogHeader>
            <DialogTitle className="text-lg">Bukti Pengiriman</DialogTitle>
            <p className="text-sm text-muted-foreground font-mono">{orderNumber}</p>
          </DialogHeader>
        )}

        <div className={isCameraMode ? "" : "space-y-4"}>
          {/* Camera Mode - Full Screen iOS Style */}
          {isCameraMode && !photo && (
            <div className="relative w-full h-screen bg-black">
              {/* Video Preview */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center justify-between p-4 safe-area-top">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white"
                    onClick={stopCamera}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <div className="text-white text-sm font-medium bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
                    {orderNumber}
                  </div>
                  <div className="w-10" /> {/* Spacer for centering */}
                </div>
              </div>

              {/* Center Guide Frame */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="relative w-[85%] max-w-md aspect-[3/4]">
                  {/* Corner Brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                  
                  {/* Helper Text */}
                  <div className="absolute -bottom-12 left-0 right-0 text-center">
                    <p className="text-white text-sm font-medium drop-shadow-lg">
                      Posisikan bukti pengiriman dalam frame
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center justify-center gap-8 p-8 pb-12 safe-area-bottom">
                  {/* Gallery Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30"
                    onClick={() => {
                      stopCamera();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload className="h-5 w-5 text-white" />
                  </Button>

                  {/* Capture Button */}
                  <button
                    onClick={capturePhoto}
                    className="relative h-20 w-20 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all active:scale-95 shadow-2xl"
                  >
                    <div className="absolute inset-2 rounded-full border-4 border-black/10" />
                  </button>

                  {/* Spacer for symmetry */}
                  <div className="h-12 w-12" />
                </div>
              </div>
            </div>
          )}

          {/* Photo Preview */}
          {photo && !isCameraMode && (
            <div className="relative">
              <img
                src={photo}
                alt="Preview"
                className="w-full h-64 object-cover rounded-2xl"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white"
                onClick={() => {
                  setPhoto(null);
                  setPhotoFile(null);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Ambil Ulang
              </Button>
            </div>
          )}

          {/* Initial State - No Camera, No Photo */}
          {!isCameraMode && !photo && (
            <div className="space-y-8 py-4">
              {/* Icon & Title */}
              <div className="text-center space-y-4">
                <div className="inline-flex p-6 bg-[#111111] rounded-full">
                  <Camera className="h-12 w-12 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-[#111111]">
                    Bukti Pengiriman
                  </h3>
                  <p className="text-sm text-[#8E8E93]">
                    Ambil foto paket yang diterima
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full h-14 rounded-2xl bg-[#111111] hover:bg-black text-white font-medium"
                  onClick={startCamera}
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Buka Kamera
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-2 hover:bg-gray-50 font-medium"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Pilih dari Galeri
                </Button>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Notes - Only show when photo is captured */}
          {photo && !isCameraMode && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Catatan Pengiriman (Opsional)
              </label>
              <Textarea
                placeholder="Contoh: Paket diterima langsung oleh penerima"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>
          )}

          {/* Actions - Only show when photo is captured */}
          {photo && !isCameraMode && (
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={handleClose} 
                className="flex-1 rounded-full border-2"
              >
                Batal
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!photo || isUploading}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full shadow-lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Konfirmasi Pengiriman
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
