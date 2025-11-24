// In your UserUploads component or a new MIDI player page
import { useState } from 'react';
import PianoRoll from '../components/PianoRoll';

const Uploads = () => {
  const [selectedMidi, setSelectedMidi] = useState<File | undefined>(undefined);

  return (
    <div className='min-h-screen bg-gray-900 text-white p-6'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold mb-6'>MIDI Player</h1>

        <input
          type='file'
          accept='.mid,.midi'
          onChange={(e) => setSelectedMidi(e.target.files?.[0] || undefined)}
          className='mb-4'
        />

        <PianoRoll midiFile={selectedMidi} />
      </div>
    </div>
  );
};

export default Uploads;
