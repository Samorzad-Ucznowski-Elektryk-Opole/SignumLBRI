/**
 * Modern Design System Components - 2025 Standards
 * Centralized UI components with glassmorphism, animations, and accessibility
 */

export interface ComponentTheme {
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      glass: string;
      overlay: string;
    };
    text: {
      primary: string;
      secondary: string;
      muted: string;
      inverse: string;
    };
    border: {
      light: string;
      medium: string;
      focus: string;
    };
    shadow: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      glass: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  blur: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface CarouselSlide {
  id: string;
  type: 'image' | 'video' | 'content';
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  content?: string;
  ctaText?: string;
  ctaUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  overlayOpacity?: number;
  duration?: number; // Auto-advance duration in ms
}

export interface CarouselConfig {
  slides: CarouselSlide[];
  autoAdvance: boolean;
  showDots: boolean;
  showArrows: boolean;
  loop: boolean;
  transitionDuration: number;
  pauseOnHover: boolean;
  swipeEnabled: boolean;
  keyboardNavigation: boolean;
  accessibility: {
    enabled: boolean;
    announceSlideChanges: boolean;
    pauseButtonLabel: string;
    playButtonLabel: string;
    nextSlideLabel: string;
    previousSlideLabel: string;
  };
}

export interface ModalConfig {
  id: string;
  title: string;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  backdrop: 'blur' | 'dark' | 'light' | 'none';
  closable: boolean;
  persistent: boolean;
  animation: 'fade' | 'slide' | 'scale' | 'flip';
  position: 'center' | 'top' | 'bottom';
  glassmorphism: boolean;
}

export interface ButtonConfig {
  variant: 'primary' | 'secondary' | 'ghost' | 'outline' | 'glass' | 'gradient';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  state: 'default' | 'hover' | 'active' | 'disabled' | 'loading';
  iconPosition: 'left' | 'right' | 'none';
  fullWidth: boolean;
  rounded: boolean;
  shadow: boolean;
  glassmorphism: boolean;
}

export interface FormFieldConfig {
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
  variant: 'default' | 'floating' | 'glass' | 'minimal';
  size: 'sm' | 'md' | 'lg';
  state: 'default' | 'focus' | 'error' | 'success' | 'disabled';
  label: string;
  placeholder?: string;
  helpText?: string;
  errorText?: string;
  required: boolean;
  validation: {
    enabled: boolean;
    rules: {
      minLength?: number;
      maxLength?: number;
      pattern?: string;
      custom?: (value: any) => boolean | string;
    };
  };
  accessibility: {
    describedBy?: string;
    labelledBy?: string;
    ariaLabel?: string;
  };
}

export interface CardConfig {
  variant: 'default' | 'glass' | 'gradient' | 'minimal' | 'elevated';
  padding: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded: boolean;
  shadow: boolean;
  border: boolean;
  hover: boolean;
  interactive: boolean;
  glassmorphism: boolean;
}

export interface NavigationConfig {
  type: 'horizontal' | 'vertical' | 'breadcrumb' | 'tabs' | 'pills';
  variant: 'default' | 'glass' | 'minimal' | 'gradient';
  size: 'sm' | 'md' | 'lg';
  alignment: 'left' | 'center' | 'right' | 'justify';
  sticky: boolean;
  animated: boolean;
  collapsible: boolean;
  activeIndicator: 'underline' | 'background' | 'pill' | 'glow';
}

export interface TooltipConfig {
  placement: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  trigger: 'hover' | 'click' | 'focus' | 'manual';
  delay: {
    show: number;
    hide: number;
  };
  animation: 'fade' | 'scale' | 'shift';
  arrow: boolean;
  glass: boolean;
  maxWidth: string;
}

export interface LoadingState {
  type: 'spinner' | 'dots' | 'bars' | 'pulse' | 'skeleton';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color: 'primary' | 'secondary' | 'neutral' | 'custom';
  text?: string;
  overlay: boolean;
  glassmorphism: boolean;
}

export interface AnimationConfig {
  enabled: boolean;
  respectReducedMotion: boolean;
  defaultDuration: number;
  defaultEasing: string;
  presets: {
    fadeIn: string;
    fadeOut: string;
    slideIn: string;
    slideOut: string;
    scaleIn: string;
    scaleOut: string;
    rotate: string;
    bounce: string;
    pulse: string;
    shake: string;
  };
}

export interface AccessibilityConfig {
  enabled: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: {
    announcements: boolean;
    liveRegions: boolean;
    skipLinks: boolean;
  };
  keyboard: {
    focusVisible: boolean;
    trapFocus: boolean;
    customShortcuts: boolean;
  };
  colorBlindness: {
    protanopia: boolean;
    deuteranopia: boolean;
    tritanopia: boolean;
  };
}

export interface DesignSystemConfig {
  theme: ComponentTheme;
  components: {
    carousel: CarouselConfig;
    modal: ModalConfig;
    button: ButtonConfig;
    form: FormFieldConfig;
    card: CardConfig;
    navigation: NavigationConfig;
    tooltip: TooltipConfig;
    loading: LoadingState;
  };
  animations: AnimationConfig;
  accessibility: AccessibilityConfig;
  breakpoints: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  zIndex: {
    base: number;
    dropdown: number;
    sticky: number;
    fixed: number;
    modal: number;
    popover: number;
    tooltip: number;
    toast: number;
  };
}

// Default 2025 Design System Configuration
export const defaultDesignSystem: DesignSystemConfig = {
  theme: {
    colors: {
      background: {
        primary: 'rgba(255, 255, 255, 0.95)',
        secondary: 'rgba(248, 250, 252, 0.8)',
        tertiary: 'rgba(241, 245, 249, 0.6)',
        glass: 'rgba(255, 255, 255, 0.1)',
        overlay: 'rgba(0, 0, 0, 0.5)'
      },
      text: {
        primary: 'rgba(15, 23, 42, 0.95)',
        secondary: 'rgba(51, 65, 85, 0.8)',
        muted: 'rgba(100, 116, 139, 0.6)',
        inverse: 'rgba(255, 255, 255, 0.95)'
      },
      border: {
        light: 'rgba(226, 232, 240, 0.5)',
        medium: 'rgba(203, 213, 225, 0.7)',
        focus: 'rgba(59, 130, 246, 0.5)'
      },
      shadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
      '4xl': '6rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px'
    },
    blur: {
      sm: '4px',
      md: '8px',
      lg: '16px',
      xl: '24px'
    }
  },
  
  components: {
    carousel: {
      slides: [],
      autoAdvance: true,
      showDots: true,
      showArrows: true,
      loop: true,
      transitionDuration: 500,
      pauseOnHover: true,
      swipeEnabled: true,
      keyboardNavigation: true,
      accessibility: {
        enabled: true,
        announceSlideChanges: true,
        pauseButtonLabel: 'Pause carousel',
        playButtonLabel: 'Play carousel',
        nextSlideLabel: 'Next slide',
        previousSlideLabel: 'Previous slide'
      }
    },
    
    modal: {
      id: '',
      title: '',
      size: 'md',
      backdrop: 'blur',
      closable: true,
      persistent: false,
      animation: 'fade',
      position: 'center',
      glassmorphism: true
    },
    
    button: {
      variant: 'primary',
      size: 'md',
      state: 'default',
      iconPosition: 'none',
      fullWidth: false,
      rounded: true,
      shadow: true,
      glassmorphism: false
    },
    
    form: {
      type: 'text',
      variant: 'default',
      size: 'md',
      state: 'default',
      label: '',
      required: false,
      validation: {
        enabled: true,
        rules: {}
      },
      accessibility: {}
    },
    
    card: {
      variant: 'default',
      padding: 'md',
      rounded: true,
      shadow: true,
      border: false,
      hover: false,
      interactive: false,
      glassmorphism: false
    },
    
    navigation: {
      type: 'horizontal',
      variant: 'default',
      size: 'md',
      alignment: 'left',
      sticky: false,
      animated: true,
      collapsible: false,
      activeIndicator: 'underline'
    },
    
    tooltip: {
      placement: 'top',
      trigger: 'hover',
      delay: { show: 200, hide: 100 },
      animation: 'fade',
      arrow: true,
      glass: false,
      maxWidth: '200px'
    },
    
    loading: {
      type: 'spinner',
      size: 'md',
      color: 'primary',
      overlay: false,
      glassmorphism: false
    }
  },
  
  animations: {
    enabled: true,
    respectReducedMotion: true,
    defaultDuration: 300,
    defaultEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    presets: {
      fadeIn: 'fadeIn 0.3s ease-out',
      fadeOut: 'fadeOut 0.3s ease-in',
      slideIn: 'slideIn 0.3s ease-out',
      slideOut: 'slideOut 0.3s ease-in',
      scaleIn: 'scaleIn 0.2s ease-out',
      scaleOut: 'scaleOut 0.2s ease-in',
      rotate: 'rotate 1s linear infinite',
      bounce: 'bounce 0.6s ease-in-out',
      pulse: 'pulse 2s ease-in-out infinite',
      shake: 'shake 0.5s ease-in-out'
    }
  },
  
  accessibility: {
    enabled: true,
    highContrast: false,
    reducedMotion: false,
    screenReader: {
      announcements: true,
      liveRegions: true,
      skipLinks: true
    },
    keyboard: {
      focusVisible: true,
      trapFocus: true,
      customShortcuts: true
    },
    colorBlindness: {
      protanopia: false,
      deuteranopia: false,
      tritanopia: false
    }
  },
  
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  zIndex: {
    base: 1,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070
  }
};
