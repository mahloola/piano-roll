import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

interface FileRecord {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

const History = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserFiles = async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching files:', error);
        return;
      }

      setFiles(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserFiles();
  }, [session]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-900 text-white p-8'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-3xl font-bold mb-8'>Your Uploads</h1>
          <p>Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-900 text-white p-8'>
      <div className='max-w-4xl mx-auto'>
        <button
          onClick={() => {
            navigate('/dashboard');
          }}
          className='bg-gray-800 hover:bg-gray-200 px-4 py-4 my-4 rounded'
        >
          ← Back to Home
        </button>
        <h1 className='text-3xl font-bold mb-2'>Your Uploads</h1>
        <p className='text-gray-400 mb-8'>Manage your personal files</p>

        {files.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-400 text-lg'>No files uploaded yet</p>
            <p className='text-gray-500 mt-2'>
              Upload your first file to get started
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {/* History Section */}
            <div className='mb-6'>
              <h2 className='text-xl font-semibold mb-4 text-gray-300'>
                History
              </h2>
              <div className='space-y-3'>
                {files.map((file) => (
                  <div
                    key={file.id}
                    className='bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors'
                  >
                    <div className='flex justify-between items-center'>
                      <div className='flex-1'>
                        <h3 className='text-lg font-medium text-white'>
                          {file.filename}
                        </h3>
                        <div className='flex items-center space-x-4 mt-1 text-sm text-gray-400'>
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>•</span>
                          <span>{file.mime_type}</span>
                          <span>•</span>
                          <span>Uploaded {formatDate(file.created_at)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigate(`/uploads/${file?.id}`);
                        }}
                        className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium'
                      >
                        Play
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
