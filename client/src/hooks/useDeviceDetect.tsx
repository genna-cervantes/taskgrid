import { useState, useEffect } from 'react';

export default function useDeviceDetect() {
  const [isMobile, setIsMobile] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  
  useEffect(() => {
    // Check if window is defined (for SSR)
    if (typeof window === 'undefined') return;
    
    // Function to update all states
    const updateDeviceInfo = () => {
      // User agent detection for device type
      const userAgent = navigator.userAgent;
      const mobileByAgent = Boolean(
        userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i)
      );
      
      // Screen size detection (using Tailwind's md breakpoint of 768px)
      const mobileBySize = window.innerWidth < 768;
      
      // Update states
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      // Consider mobile if either detection method returns true
      setIsMobile(mobileByAgent || mobileBySize);
    };
    
    // Run on mount
    updateDeviceInfo();
    
    // Add event listener for window resize
    window.addEventListener('resize', updateDeviceInfo);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateDeviceInfo);
  }, []);
  
  return { 
    isMobile,
    windowSize,
    // Additional helper properties
    isSmallScreen: windowSize.width < 640, // sm breakpoint
    isMediumScreen: windowSize.width >= 768 && windowSize.width < 1024, // md breakpoint
    isLargeScreen: windowSize.width >= 1024 // lg breakpoint
  };
}