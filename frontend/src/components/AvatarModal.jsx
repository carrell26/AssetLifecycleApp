import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

export default function AvatarModal({ isOpen, onClose, onAvatarUpdated }) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("camera"); // 'camera' | 'file'
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fitMode, setFitMode] = useState("cover-top"); // 'cover-top' | 'cover-center' | 'contain'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clean up camera stream on unmount or close
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setErrorMsg("Tidak dapat mengakses kamera. Pastikan izin kamera aktif.");
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "camera" && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab, capturedImage]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    // Crop center-top agar wajah/kepala tidak terpotong
    const vWidth = videoRef.current.videoWidth;
    const vHeight = videoRef.current.videoHeight;
    const size = Math.min(vWidth, vHeight);
    const startX = (vWidth - size) / 2;
    const startY = Math.max(0, (vHeight - size) * 0.15);

    ctx.drawImage(videoRef.current, startX, startY, size, size, 0, 0, 400, 400);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg("");
    }
  };

  const getCroppedImageDataUrl = () => {
    return new Promise((resolve) => {
      if (!previewUrl) return resolve(null);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext("2d");

        const imgW = img.naturalWidth || img.width;
        const imgH = img.naturalHeight || img.height;

        if (fitMode === "contain") {
          const scale = Math.min(400 / imgW, 400 / imgH);
          const w = imgW * scale;
          const h = imgH * scale;
          const x = (400 - w) / 2;
          const y = (400 - h) / 2;
          ctx.fillStyle = isDark ? "#071426" : "#f8fafc";
          ctx.fillRect(0, 0, 400, 400);
          ctx.drawImage(img, x, y, w, h);
        } else {
          const scale = Math.max(400 / imgW, 400 / imgH);
          const w = imgW * scale;
          const h = imgH * scale;
          const x = (400 - w) / 2;
          const y = fitMode === "cover-top" ? 0 : (400 - h) / 2;
          ctx.drawImage(img, x, y, w, h);
        }
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.onerror = () => resolve(null);
      img.src = previewUrl;
    });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let res;
      if (activeTab === "camera" && capturedImage) {
        res = await fetch("/api/me/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_data: capturedImage }),
        });
      } else if (activeTab === "file" && (previewUrl || selectedFile)) {
        const croppedData = await getCroppedImageDataUrl();
        if (croppedData) {
          res = await fetch("/api/me/avatar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_data: croppedData }),
          });
        } else {
          const formData = new FormData();
          formData.append("avatar", selectedFile);
          res = await fetch("/api/me/avatar", {
            method: "POST",
            body: formData,
          });
        }
      } else {
        setErrorMsg("Pilih gambar terlebih dahulu");
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Foto profil berhasil diperbarui!");
        if (onAvatarUpdated) {
          onAvatarUpdated(data.avatar_url);
        }
        setTimeout(() => {
          handleClose();
        }, 1200);
      } else {
        setErrorMsg(data.error || "Gagal mengunggah foto profil");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMsg("Terjadi kesalahan koneksi ke server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMsg("");
    setSuccessMsg("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 transition-all transform ${
          isDark
            ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 border-b ${
            isDark ? "border-[#1A2E4C]" : "border-slate-100"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`material-symbols-outlined text-[22px] ${
                isDark ? "text-[#38BDF8]" : "text-[#1677FF]"
              }`}
            >
              photo_camera
            </span>
            <h3
              className={`text-base font-semibold ${
                isDark ? "text-[#E6EDF7]" : "text-slate-900"
              }`}
            >
              Ubah Foto Profil
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div
          className={`flex items-center gap-1.5 mt-4 p-1 rounded-xl border transition-colors ${
            isDark
              ? "bg-[#071426] border-[#1E3A5F]"
              : "bg-slate-100 border-slate-200"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab("camera");
              setCapturedImage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "camera"
                ? "bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/25 font-semibold"
                : isDark
                  ? "text-[#94A3B8] hover:text-white hover:bg-white/5 font-medium"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white font-medium"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            Kamera Langsung
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("file");
              stopCamera();
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "file"
                ? "bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/25 font-semibold"
                : isDark
                  ? "text-[#94A3B8] hover:text-white hover:bg-white/5 font-medium"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white font-medium"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            Unggah File / Galeri
          </button>
        </div>

        {/* Content Area */}
        <div className="my-5 flex flex-col items-center justify-center">
          {activeTab === "camera" ? (
            <div className="w-full flex flex-col items-center">
              {capturedImage ? (
                <div className="relative flex flex-col items-center">
                  <img
                    src={capturedImage}
                    alt="Snapshot Preview"
                    className="w-48 h-48 rounded-full object-cover ring-4 ring-[#1677FF] shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedImage(null);
                      startCamera();
                    }}
                    className={`mt-3 px-3.5 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 mx-auto transition-colors cursor-pointer border ${
                      isDark
                        ? "bg-[#142D4C] hover:bg-[#1E3A5F] text-[#E6EDF7] border-[#1E3A5F]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">replay</span>
                    Ambil Ulang
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <div
                    className={`relative w-56 h-56 rounded-full overflow-hidden bg-black ring-4 flex items-center justify-center shadow-inner ${
                      isDark ? "ring-[#1E3A5F]" : "ring-slate-200"
                    }`}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {!cameraActive && (
                      <span className="absolute text-xs text-slate-300 px-4 text-center font-medium select-none">
                        Mengaktifkan kamera...
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={!cameraActive}
                    className="mt-4 px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 bg-[#1677FF] hover:bg-blue-600 active:scale-95 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                    Ambil Foto
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {previewUrl ? (
                <div className="flex flex-col items-center">
                  <div className="w-48 h-48 rounded-full overflow-hidden ring-4 ring-[#1677FF] shadow-lg flex items-center justify-center bg-black/5 dark:bg-black/30">
                    <img
                      src={previewUrl}
                      alt="Preview File"
                      className={`w-full h-full ${
                        fitMode === "contain"
                          ? "object-contain p-2"
                          : fitMode === "cover-top"
                            ? "object-cover object-top"
                            : "object-cover object-center"
                      }`}
                    />
                  </div>

                  {/* Framing options */}
                  <div className="flex items-center gap-1.5 mt-3.5 p-1 rounded-xl border transition-colors bg-slate-100 dark:bg-[#071426] border-slate-200 dark:border-[#1E3A5F]">
                    <button
                      type="button"
                      onClick={() => setFitMode("cover-top")}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        fitMode === "cover-top"
                          ? "bg-[#1677FF] text-white shadow-xs"
                          : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white"
                      }`}
                      title="Prioritaskan area wajah/kepala agar tidak terpotong"
                    >
                      Fokus Wajah
                    </button>
                    <button
                      type="button"
                      onClick={() => setFitMode("cover-center")}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        fitMode === "cover-center"
                          ? "bg-[#1677FF] text-white shadow-xs"
                          : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Tengah
                    </button>
                    <button
                      type="button"
                      onClick={() => setFitMode("contain")}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        fitMode === "contain"
                          ? "bg-[#1677FF] text-white shadow-xs"
                          : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white"
                      }`}
                      title="Seluruh foto masuk utuh ke dalam lingkaran tanpa terpotong"
                    >
                      Tampil Utuh
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-3 px-3.5 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 mx-auto transition-colors cursor-pointer border ${
                      isDark
                        ? "bg-[#142D4C] hover:bg-[#1E3A5F] text-[#E6EDF7] border-[#1E3A5F]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    Ganti File
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDark
                      ? "border-[#1E3A5F] hover:border-[#1677FF] bg-[#071426]/60 text-[#E6EDF7]"
                      : "border-slate-300 hover:border-[#1677FF] bg-slate-50 hover:bg-blue-50/50 text-slate-800"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[38px] ${
                      isDark ? "text-[#38BDF8]" : "text-[#1677FF]"
                    }`}
                  >
                    add_photo_alternate
                  </span>
                  <p
                    className={`text-xs font-semibold mt-2.5 ${
                      isDark ? "text-[#E6EDF7]" : "text-slate-800"
                    }`}
                  >
                    Klik untuk memilih foto
                  </p>
                  <span
                    className={`text-[11px] mt-0.5 ${
                      isDark ? "text-[#94A3B8]" : "text-slate-500"
                    }`}
                  >
                    JPG, PNG, atau WEBP
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div
            className={`p-3 mb-3 rounded-xl text-xs flex items-center gap-2 border ${
              isDark
                ? "bg-rose-500/15 border-rose-500/35 text-rose-300"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
          >
            <span className="material-symbols-outlined text-[17px] shrink-0">error</span>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div
            className={`p-3 mb-3 rounded-xl text-xs flex items-center gap-2 border ${
              isDark
                ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            <span className="material-symbols-outlined text-[17px] shrink-0">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div
          className={`flex items-center justify-center gap-3 pt-3 border-t ${
            isDark ? "border-[#1A2E4C]" : "border-slate-100"
          }`}
        >
          <button
            type="button"
            onClick={handleClose}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
              isDark
                ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                : "border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={
              isSubmitting ||
              (activeTab === "camera" && !capturedImage) ||
              (activeTab === "file" && !selectedFile)
            }
            className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 bg-[#1677FF] hover:bg-blue-600 active:scale-95 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin material-symbols-outlined text-[16px]">
                  progress_activity
                </span>
                Menyimpan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                Simpan Foto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
