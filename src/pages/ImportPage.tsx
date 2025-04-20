
import React from 'react';
import ImportTabs from '@/components/import/ImportTabs';

const ImportPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Import Questions</h1>
      </div>
      
      <ImportTabs />
    </div>
  );
};

export default ImportPage;
