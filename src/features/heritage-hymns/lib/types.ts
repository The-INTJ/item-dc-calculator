export type ContributorRole = 'words' | 'music' | 'translator' | 'editor' | 'arranger';

export interface Contributor {
  displayName: string;
  sortName: string;
  roles: ContributorRole[];
}

export interface HymnCopyright {
  wordsPublicDomain: boolean;
  musicPublicDomain: boolean;
}

export interface HymnMaterials {
  midi?: boolean;
  congregation?: boolean;
  pdf?: boolean;
}

export interface HymnEntry {
  id: string;
  number: number;
  title: string;
  firstLine: string;
  chorusFirstLine?: string;
  tuneName?: string;
  meter?: string;
  era: string;
  themes: string[];
  contributors: Contributor[];
  copyright: HymnCopyright;
  materials?: HymnMaterials;
}

export type FilterCategory = 'theme' | 'contributors' | 'era' | 'meter';

export type FilterState = Record<FilterCategory, string[]>;

export type SortKey = 'title' | 'number' | 'era' | 'tune';

export type SortDirection = 'asc' | 'desc';

export interface ThemeOption {
  label: string;
  selectable: boolean;
  depth?: 0 | 1;
}

export interface SearchMatch {
  field:
    | 'number'
    | 'title'
    | 'firstLine'
    | 'chorusFirstLine'
    | 'tuneName'
    | 'contributors'
    | 'era'
    | 'meter'
    | 'theme';
  value: string;
  start: number;
  end: number;
}

export interface HymnSearchResult {
  entry: HymnEntry;
  matches: SearchMatch[];
}
