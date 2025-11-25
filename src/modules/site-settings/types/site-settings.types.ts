export interface ISiteSettingTranslation {
  id: string;
  siteSettingId: string;
  locale: string;
  value: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ISiteSetting {
  id: string;
  key: string;
  value: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  translations?: ISiteSettingTranslation[];
}

// Specific setting types
export interface IGithubSettings {
  repoUrl: string;
  followers: number;
}

export interface ICVSettings {
  url: string;
  fileName: string;
}

export interface ICVTranslation {
  label: string;
}

export interface IHeroSettings {
  techIcons: string[];
}

export interface IHeroTranslation {
  badge: string;
  title: string;
  description: string;
  cta: string;
}

export interface IStatisticItem {
  id: string;
  value: number;
  suffix?: string;
  icon: string;
}

export interface IStatisticsSettings {
  items: IStatisticItem[];
}

export interface IStatisticsTranslation {
  title: string;
  description: string;
  items: {
    [key: string]: {
      label: string;
    };
  };
}

export interface IAboutHighlight {
  id: string;
  icon: string;
}

export interface IAboutSettings {
  highlights: IAboutHighlight[];
}

export interface IAboutTranslation {
  title: string;
  description1: string;
  description2: string;
  cta: string;
  highlights: {
    [key: string]: {
      title: string;
      description: string;
    };
  };
}

export interface IFooterSocialLink {
  icon: string;
  href: string;
}

export interface IFooterLinkItem {
  href: string;
  key: string;
}

export interface IFooterColumn {
  key: string;
  links: IFooterLinkItem[];
}

export interface IFooterContact {
  email: string;
  phone: string;
  location: string;
}

export interface IFooterSettings {
  socialLinks: IFooterSocialLink[];
  columns: IFooterColumn[];
  contact: IFooterContact;
}

export interface IFooterColumnTranslation {
  title: string;
  links: {
    [key: string]: string;
  };
}

export interface IFooterTranslation {
  description: string;
  contact: {
    title: string;
  };
  columns: {
    [key: string]: IFooterColumnTranslation;
  };
  copyright: string;
  rights: string;
}

