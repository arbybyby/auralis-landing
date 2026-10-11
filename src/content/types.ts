export interface ContentLink {
  label: string;
  href: string;
}

export interface TitledItem {
  title: string;
  text: string;
}

export interface NumberedItem extends TitledItem {
  number: string;
}
