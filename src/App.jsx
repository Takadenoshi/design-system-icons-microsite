import { useState, useEffect, useCallback, useMemo, useRef, } from 'react';
import './App.css'

function unique(arr) {
  return [...new Set(arr)];
}

function useIconData() {
  const [error, setError] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});

  const reloadData = async () => {
    setError();
    setLoading(true);
    try {
      const response = await fetch(`https://raw.githubusercontent.com/kadena-community/design-system/main/builds/tokens/kda-design-system.raw.svg.tokens.json`);
      const data = await response.json();
      const inputData = data.kda.foundation.icon;
      function parseIcons(obj, groups=[]) {
        // obj can be variable length; collect keys into "group" until we hit the icon definition with $type
        // returns flat list of icon defs
        const out = [];
        for(const [label, def] of Object.entries(obj)) {
          if (def["$type"] === "icon") {
            def.$groups = [...groups];
            def.$keywords = unique([
              ...label.split("_"),
              ...def.$name.toLowerCase().split("_"),
              ...def.$groups.flatMap(g => g.split("_")),
            ]).map(word => word.toLowerCase());
            def['$key'] = [...groups, label].join('_');
            out.push(def)
          } else {
            out.push(...parseIcons(def, [...groups, label]));
          }
        }
        return out;
      }
      const flatIcons = parseIcons(inputData);
      const dictIcons = Object.fromEntries(flatIcons.map(icon => ([icon["$key"], icon])));
      setData(dictIcons);
      setError();
    } catch(e) {
      console.error(e);
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

function capitalizeFirst(str = '') {
  return str[0].toUpperCase() + str.slice(1);
}

function IconPanel({ data, close, icons, }) {
  const copyIcon = icons && icons['system_mono_content_copy'];
  const successIcon = icons && icons['system_mono_check'];
  const closeIcon = icons && icons['system_mono_close'];
  const downloadIcon = icons && icons['system_mono_download'];

  const { "$value": contents, "$name": name, "$key": key, "$description": description } = data;

  const displayName = [...data['$groups'].slice(1), ...name.split("_")].map(
    word => capitalizeFirst(word)
  ).join('');

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
        <div className="row">NAME <span className="value">{displayName}</span><Copy copyIcon={copyIcon} successIcon={successIcon} value={displayName} /></div>
        { description ? <div>Description: {description}</div> : null }
        <div className="row"><div>SOURCE</div><Copy copyIcon={copyIcon} successIcon={successIcon} value={contents} /></div>
        <div className="row">DOWNLOAD <DownloadIcon icon={downloadIcon} name={key} source={contents} /></div>
      </div>
    </div>
  </div>
}

function downloadFile(fileName, data) {
  const downloadLink = document.createElement('a');
  downloadLink.download = fileName;
  const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=image/svg+xml;' }));
  downloadLink.href = url;
  downloadLink.click();
  URL.revokeObjectURL(url);
}

function DownloadIcon({ icon, name, source, }) {
  const onClick = () => { downloadFile(`${name}.svg`, source) };
  return <div className="copy-btn icon" style={{backgroundColor: 'transparent'}} onClick={onClick} dangerouslySetInnerHTML={{__html: icon['$value']}}></div>;
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
  const inputRef = useRef();
  const iconsRef = useRef();

  const handleKey = useCallback((e) => {
    if (e.target.tagName === "INPUT" && e.key === "Enter") {
      iconsRef.current.childNodes[0].focus()
    }
    if (e.target.tagName === "INPUT")
      return;
    if (e.key === '/' || (e.key === 'k' && e.ctrlKey)) {
      console.log('a');
      inputRef.current.focus();
      e.stopPropagation();
      e.preventDefault();
      window.scrollTo(0, 0);
      return false;
    }
    if (e.key === 's') {
      setSize(size => {
        const currentIdx = iconSizes.indexOf(size);
        const next = (currentIdx + 1) % iconSizes.length;
        return iconSizes[next];
      });
    }
    if (e.key === 't') {
      setTheme(theme => {
        const currentIdx = themes.indexOf(theme);
        const next = (currentIdx + 1) % themes.length;
        return themes[next];
      });
    }
  }, [inputRef]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey, false);
    return () => document.removeEventListener("keydown", handleKey, false);
  }, []);

  const handleIconKeyPress = useCallback((e, data) => {
    if (e.key === "Enter") {
      setSelectedIcon(data);
    }
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const move = e.key === "ArrowLeft" ? -1 : 1;
      const { target: current } = e;
      const { parentNode: parent } = current;
      if (move === 1) {
        // right
        const focus = current.nextSibling ?? parent.childNodes[0];
        focus.focus();
      } else {
        // left
        const focus = current.previousSibling ?? parent.childNodes[parent.childNodes.length - 1];
        focus.focus();
      }
    }
  }, []);

  return (
    <div className={`page ${theme}`}>
      <div className="page-inner">
        <div className="heading">
          Kadena Design System Icons
        </div>
        <div className="toolbar">
          <div>
            <input ref={inputRef} autoFocus placeholder="Filter icons" onChange={({target:{value}}) => setSearch(value.toLowerCase())} />
          </div>
          <div style={{marginRight: '1rem'}}>
            <u>S</u>ize {iconSizes.map((s, i) => <button tabIndex={-1} key={`button-${s}`} className={size === s ? 'active' : ''} onClick={() => setSize(s)}>{s.toUpperCase()}</button>)}
          </div>
          <div>
            <u>T</u>heme {themes.map((t, i) => <button tabIndex={-1} key={`button-${t}`} className={theme === t ? 'active' : ''} onClick={() => setTheme(t)}>{t.toUpperCase()}</button>)}
          </div>
        </div>
        <div className={`icon-list ${size.toLowerCase()}`} ref={iconsRef}>
          {Object.values(data)
              .filter(({"$keywords": words}) => { 
                if (!search) return true;
                const lowerSearch = search.toLowerCase();
                return words.some(word => word.includes(search));
              })
              .map((data, i) => {
                const {"$value": contents, "$name": name} = data;
          return <div key={'k'+i} tabIndex={0} onKeyDown={e => handleIconKeyPress(e, data)} onClick={() => setSelectedIcon(data)} className="fake-btn icon" dangerouslySetInnerHTML={{__html: contents}}></div>;
            }
          )}
        </div>
        { selectedIcon ? <IconPanel icons={data} data={selectedIcon} close={() => setSelectedIcon()} /> : null }
      </div>
    </div>
  )
}

export default App
