import type { Row } from '@tanstack/react-table';
import type { TFile } from 'librechat-data-provider';
import ImagePreview from '~/components/Chat/Input/Files/ImagePreview';
import FilePreview from '~/components/Chat/Input/Files/FilePreview';
import { getFileType, getDisplayFilename } from '~/utils';

export default function PanelFileCell({ row }: { row: Row<TFile | undefined> }) {
  const file = row.original;
  const displayName = getDisplayFilename(file?.filename, file?.file_id);
  return (
    <div className="flex w-full items-center gap-2">
      {file?.type?.startsWith('image') === true ? (
        <ImagePreview
          url={file.filepath}
          className="h-8 w-8 flex-shrink-0"
          source={file.source}
          alt={displayName}
        />
      ) : (
        <FilePreview fileType={getFileType(file?.type)} file={file} />
      )}
      <div className="min-w-0 flex-1 overflow-hidden">
        <span className="block w-full overflow-hidden truncate text-ellipsis whitespace-nowrap text-xs">
          {displayName}
        </span>
      </div>
    </div>
  );
}
