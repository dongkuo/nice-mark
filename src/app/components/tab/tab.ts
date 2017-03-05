export class Tab {
  name: string;
  theme: string;
  selected: boolean;

  constructor(name, theme, selected = false) {
    this.name = name;
    this.theme = theme;
    this.selected = selected;
  }
}
