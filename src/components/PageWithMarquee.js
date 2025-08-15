import React from 'react';
import NewsMarquee from '@/components/NewsMarquee';

const PageWithMarquee = ({ children }) => {
  return (
    <>
      <NewsMarquee />
      {children}
    </>
  );
};

export default PageWithMarquee;
