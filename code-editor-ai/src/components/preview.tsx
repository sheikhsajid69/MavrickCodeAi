'use client';

import * as React from 'react';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface PreviewProps {
  className?: string;
}

export function Preview({ className }: PreviewProps) {
  const { activeFileId, files, showPreview } = useEditorStore();
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // Get all files content to create a complete preview environment
  const allFiles = Object.values(files);
  const htmlFile = allFiles.find(file => file.name.endsWith('.html'));
  const cssFiles = allFiles.filter(file => file.name.endsWith('.css'));
  const jsFiles = allFiles.filter(file => file.name.endsWith('.js'));

  // Create srcDoc content
  const generateSrcDoc = React.useMemo(() => {
    let htmlContent = htmlFile?.content || '<html><head></head><body><div id="app"></div></body></html>';

    // Add CSS content as style tags
    const cssContent = cssFiles.map(file => `<style>${file.content}</style>`).join('');

    // Add JS content as script tags
    const jsContent = jsFiles.map(file => `<script>${file.content}</script>`).join('');

    // Inject CSS in head and JS at the end of body
    if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', `${cssContent}</head>`);
    } else {
      htmlContent = htmlContent.replace('<head>', `<head>${cssContent}`);
    }

    if (htmlContent.includes('</body>')) {
      htmlContent = htmlContent.replace('</body>', `${jsContent}</body>`);
    } else {
      htmlContent = htmlContent.replace('<body>', `<body>${jsContent}`);
    }

    return htmlContent;
  }, [htmlFile, cssFiles, jsFiles]);

  if (!showPreview) {
    return null;
  }

  return (
    <div className={cn('h-full bg-white', className)}>
      <iframe
        ref={iframeRef}
        title="Preview"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-modals"
        srcDoc={generateSrcDoc}
      />
    </div>
  );
}
