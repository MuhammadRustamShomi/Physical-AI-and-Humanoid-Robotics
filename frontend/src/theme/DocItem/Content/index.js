/**
 * Swizzled DocItem Content to inject ChapterToolbar.
 */
import React from 'react';
import Content from '@theme-original/DocItem/Content';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useDoc } from '@docusaurus/plugin-content-docs/client';

function ChapterToolbarWrapper() {
  const [ChapterToolbar, setChapterToolbar] = React.useState(null);
  const doc = useDoc();

  React.useEffect(() => {
    import('../../../components/ChapterToolbar').then((module) => {
      setChapterToolbar(() => module.default);
    });
  }, []);

  if (!ChapterToolbar) {
    return null;
  }

  // Get chapter info from doc metadata
  const chapterPath = doc.metadata.slug || doc.metadata.id;
  const chapterTitle = doc.metadata.title || 'Chapter';

  return (
    <ChapterToolbar
      chapterPath={chapterPath}
      chapterTitle={chapterTitle}
    />
  );
}

export default function ContentWrapper(props) {
  return (
    <>
      <BrowserOnly fallback={null}>
        {() => <ChapterToolbarWrapper />}
      </BrowserOnly>
      <Content {...props} />
    </>
  );
}
