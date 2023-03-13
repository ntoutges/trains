interface JDONInterface {
  filename: string,
  properties?: string[]
}

export class JDON {
  private readonly props: Record<string, string> = {};
  private readonly filename: string;
  private gotDataState: 0|1|2 = 0; // 0=unset;1=received;2=alerted
  private _onData: () => void = null;
  constructor({
    filename,
    properties = []
  }: JDONInterface) {
    for (const prop of properties) {
      this.props[prop] = "unset";
    }
    this.filename = filename;
    this.setProperties();
  }

  setProperties() {
    fetch(this.filename)
    .then(response => response.text())
    .then(data => {
      const props = this.parseProperties(data);
      for (const name in props) { this.props[name] = props[name]; }
      this.gotDataState = 1;
      if (this._onData) {
        this._onData();
        this.gotDataState = 2;
      }
    });
  }

  parseProperties(data: string) {
    const lines = data.split("\n").map((x) => x.replace(/ /g, "")); // remove all spaces
    const props: Record<string, string> = {};
    for (let line of lines) {
      const nameEnd = line.indexOf(":");
      let valEnd = line.indexOf("//"); // allow for comments
      
      if (valEnd == 0) { continue; } // line is just a comment
      if (nameEnd == -1) { continue; } // invalid property; treat as unset
      if (valEnd == -1) { valEnd = line.length; } // no comments

      const propName = line.substring(0,nameEnd);
      const propVal = line.substring(nameEnd+1, valEnd);
      props[propName] = propVal;
    }
    return props;
  }

  onData(callback: () => void) {
    this._onData = callback;
    if (this.gotDataState == 1) {
      this._onData();
      this.gotDataState = 2;
    }
  }

  getProps() { return Object.keys(this.props); }
  getProp(propName: string) { return this.props[propName] ?? "null"; }
}