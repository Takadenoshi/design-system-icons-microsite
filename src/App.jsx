import { useState, useEffect, useCallback, useMemo, } from 'react';
import './App.css'

function useIconData() {
  const [error, setError] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const reloadData = async () => {
    setError();
    setLoading(true);
    try {
      const response = await fetch(`https://raw.githubusercontent.com/kadena-community/design-system/main/tokens/foundation/icon/svg.tokens.json`);
      const data = await response.json();
      setData(Object.values(data.kda.foundation.icon));
      setError();
    } catch(e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    reloadData();
  }, []);

  return { loading, data, error, reloadData };
}

function Copy({ copyIcon, successIcon, value }) {
  const [label, setLabel] = useState(copyIcon && copyIcon['$value']);
  const onClick = useCallback(() => {
    navigator.clipboard.writeText(value);
    setLabel(successIcon && successIcon['$value']);
    setTimeout(() => setLabel(copyIcon && copyIcon['$value']), 1500);
  }, [value]);
  return <div className="copy-btn icon" style={{backgroundColor: 'transparent'}} onClick={onClick} dangerouslySetInnerHTML={{__html: label}}></div>;
}

function IconPanel({ data, close, copyIcon, successIcon, closeIcon }) {
  const { "$value": contents, "$name": name, "$description": description } = data;
  console.log(data);
  return <div className="icon-panel">
    <div className="close-btn md">
      <button className="fake-btn icon" style={{margin: 0, backgroundColor: 'transparent'}} onClick={close} dangerouslySetInnerHTML={{__html: closeIcon['$value']}}></button>
    </div>
    <div className="body">
      <div className="icons">
        <div className="icon huge" dangerouslySetInnerHTML={{__html: contents}}></div>
        <div className="icon-col lg">
            <div className="icon light" dangerouslySetInnerHTML={{__html: contents}}></div>
            <div className="icon dark" dangerouslySetInnerHTML={{__html: contents}}></div>
        </div>
        <div className="icon-col md">
          <div className="icon light" dangerouslySetInnerHTML={{__html: contents}}></div>
          <div className="icon dark" dangerouslySetInnerHTML={{__html: contents}}></div>
        </div>
        <div className="icon-col sm">
          <div className="icon light" dangerouslySetInnerHTML={{__html: contents}}></div>
          <div className="icon dark" dangerouslySetInnerHTML={{__html: contents}}></div>
        </div>
      </div>
      <div className="right">
        <div className="row">NAME <span className="value">{name}</span><Copy copyIcon={copyIcon} successIcon={successIcon} value={name} /></div>
        { description ? <div>Description: {description}</div> : null }
      </div>
    </div>
  </div>
}

const themes = ['light', 'dark'];
const defaultTheme = 1; // DARK

const iconSizes = ['sm', 'md', 'lg'];
const defaultIconSize = 1; // MD

function App() {
  const { loading, data, error } = useIconData();
  const [search, setSearch] = useState("");
  const [size, setSize] = useState(iconSizes[defaultIconSize]);
  const [theme, setTheme] = useState(themes[defaultTheme]);
  const [selectedIcon, setSelectedIcon] = useState(null);

  const copyIcon = useMemo(() => {
    return data.find(({"$name": n}) => n === 'content_copy');
  }, [data]);
  const successIcon = useMemo(() => {
    return data.find(({"$name": n}) => n === 'check');
  }, [data]);
  const closeIcon = useMemo(() => {
    return data.find(({"$name": n}) => n === 'close');
  }, [data]);

  return (
    <div className={`page ${theme}`}>
      <div className="page-inner">
        <div className="heading">
          Kadena Design System Icons
        </div>
        <div className="toolbar">
          <div><input autoFocus placeholder="Filter icons" onChange={({target:{value}}) => setSearch(value.toLowerCase())} /></div>
          <div style={{marginRight: '1rem'}}>
            Size {iconSizes.map((s, i) => <button key={`button-${s}`} className={size === s ? 'active' : ''} onClick={() => setSize(s)}>{s.toUpperCase()}</button>)}
          </div>
          <div>
            Theme {themes.map((t, i) => <button key={`button-${t}`} className={theme === t ? 'active' : ''} onClick={() => setTheme(t)}>{t.toUpperCase()}</button>)}
          </div>
        </div>
        <div className={`icon-list ${size.toLowerCase()}`}>
          {data
              .filter(({"$name": n, "$description": d}) => !search ? true : n.toLowerCase().includes(search) || d.toLowerCase().includes(search))
              .map((data, i) => {
                const {"$value": contents, "$name": name} = data;
                return <div key={'k'+i} onClick={() => setSelectedIcon(data)} className="fake-btn icon" dangerouslySetInnerHTML={{__html: contents}}></div>;
            }
          )}
        </div>
        { selectedIcon ? <IconPanel closeIcon={closeIcon} copyIcon={copyIcon} successIcon={successIcon} data={selectedIcon} close={() => setSelectedIcon()} /> : null }
      </div>
    </div>
  )
}

export default App
