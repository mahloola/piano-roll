import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { uploadFile } from '../utils/supabaseUpload.ts';

const FileUpload = () => {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user?.id) return;

    setUploading(true);

    const result = await uploadFile({
      file,
      userId: session?.user?.id,
    });

    if (result.success) {
      console.log('File uploaded successfully!', result.fileId);
    } else {
      console.error('Upload failed:', result.error);
    }

    setUploading(false);
    navigate('/uploads');

    // reset the input to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className='flex flex-col items-center gap-2'>
      <input
        ref={fileInputRef}
        type='file'
        onChange={handleFileUpload}
        disabled={uploading}
        accept='.mid,.midi'
        className='hidden'
      />

      <button
        onClick={handleButtonClick}
        disabled={uploading}
        className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed'
      >
        {uploading ? 'Uploading...' : 'Upload MIDI File'}
      </button>

      {uploading && <p className='text-gray-400'>Uploading your file...</p>}
    </div>
  );
};

export default FileUpload;
