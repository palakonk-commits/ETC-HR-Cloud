import { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera as CameraIcon, RotateCcw } from 'lucide-react';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  capturedImage?: string;
}

export function Camera({ onCapture, capturedImage }: CameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const [hasPermission, setHasPermission] = useState(true);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  }, [onCapture]);

  const retake = () => {
    onCapture('');
  };

  const handleUserMediaError = () => {
    setHasPermission(false);
  };

  if (!hasPermission) {
    return (
      <div className="camera-error">
        <p>⚠️ ไม่สามารถเข้าถึงกล้องได้</p>
        <p>กรุณาอนุญาตการใช้งานกล้องในเบราว์เซอร์</p>
      </div>
    );
  }

  if (capturedImage) {
    return (
      <div className="camera-preview">
        <img src={capturedImage} alt="ภาพถ่าย" />
        <button onClick={retake} className="btn btn-secondary">
          <RotateCcw size={18} />
          ถ่ายใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="camera-container">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: 480,
          height: 360,
          facingMode: 'user',
        }}
        onUserMediaError={handleUserMediaError}
        className="webcam"
      />
      <button onClick={capture} className="btn btn-primary capture-btn">
        <CameraIcon size={20} />
        ถ่ายรูป
      </button>
    </div>
  );
}
