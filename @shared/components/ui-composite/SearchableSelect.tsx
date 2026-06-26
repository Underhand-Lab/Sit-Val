import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Div, InputText, vars } from '@shared/bridges/UIBridge';
import { Option, SelectSection, useSearchableSelect } from './useSearchableSelect';

interface SearchableSelectProps {
  value: string;
  sections: SelectSection[];
  onChange: (value: string) => void;
  placeholder?: string;
  renderOption?: (option: Option, isSelected: boolean, isHovered: boolean) => React.ReactNode;
  style?: any;
  inputStyle?: any;
  searchResultsLabel?: string;
  searchOptions?: Option[];
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ value, sections, onChange, placeholder = 'Search...', renderOption, style, inputStyle, searchResultsLabel, searchOptions }) => {
  const searchableSections = searchOptions ? [{ options: searchOptions }] : sections;
  const { isOpen, isEditable, searchTerm, setSearchTerm, hoveredValue, setHoveredValue, menuStyle, containerRef, menuRef, inputRef, mobileInputRef, filteredOptions, isInitialState, handleSelect, handleActivation } = useSearchableSelect({ value, sections: searchableSections, onChange, placeholder });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const inputProps = {
    placeholder,
    value: searchTerm,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && searchTerm) {
        const matched = searchableSections.flatMap((s) => s.options).find((o) => o?.label?.toLowerCase() === searchTerm.toLowerCase());
        handleSelect(matched ? matched.value : searchTerm);
      }
    },
  };

  useEffect(() => {
    if (isMobile && isEditable && mobileInputRef.current) {
      const el = mobileInputRef.current;
      el.focus({ preventScroll: true });
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [isEditable, isMobile]);

  return (
    <Div ref={containerRef} style={{ position: 'relative', width: '100%', opacity: (isMobile && isEditable) ? 0.5 : 1, ...style }} onClick={handleActivation} onTouchEnd={(e) => { if (isMobile && !isEditable) { handleActivation(); e.preventDefault(); } }}>
      <InputText ref={inputRef} type="text" {...inputProps} readOnly={isMobile ? true : !isEditable} inputMode={(!isMobile && isEditable) ? 'text' : 'none'} style={{ cursor: (isMobile || !isEditable) ? 'pointer' : 'text', pointerEvents: (isMobile || !isEditable) ? 'none' : 'auto', caretColor: isEditable ? 'auto' : 'transparent', ...inputStyle }} />
      {isOpen && createPortal(
        <Div ref={menuRef} onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} style={{ ...menuStyle, ...(!isMobile && { position: 'absolute', top: containerRef.current ? containerRef.current.getBoundingClientRect().bottom + window.scrollY : menuStyle.top, left: containerRef.current ? containerRef.current.getBoundingClientRect().left + window.scrollX : menuStyle.left, width: containerRef.current ? containerRef.current.offsetWidth : menuStyle.width, bottom: 'auto', height: 'auto' }), background: vars.surface, border: (isMobile && isEditable) ? 'none' : `1px solid ${vars.text}33`, borderRadius: '0px', padding: '4px 0' }}>
          {isMobile && isEditable && <Div style={{ padding: '12px', background: vars.surface, borderTop: `1px solid ${vars.text}22` }}><InputText ref={mobileInputRef} type="text" {...inputProps} style={{ width: '100%', ...inputStyle }} /></Div>}
          <Div style={{ maxHeight: (isMobile && isEditable) ? '40vh' : '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
            {isInitialState && sections.map((section: SelectSection, sIdx: number) => (
              <React.Fragment key={`section-${sIdx}`}>
                {section.options.length > 0 && <>
                  {section.label && <Div style={{ fontSize: '10px', padding: '4px 12px', opacity: 0.5, fontWeight: 'bold', color: vars.text, textAlign: 'left' }}>{section.label.toUpperCase()}</Div>}
                  {section.options.map((opt: Option) => <Div key={opt.value} onClick={() => handleSelect(opt.value)} onMouseEnter={() => setHoveredValue(opt.value)} onMouseLeave={() => setHoveredValue(null)} style={optionStyle(value === opt.value, hoveredValue === opt.value)}>{renderOption ? renderOption(opt, value === opt.value, hoveredValue === opt.value) : opt.label}</Div>)}
                </>}
              </React.Fragment>
            ))}
            {!isInitialState && <>
              {searchResultsLabel && <Div style={{ fontSize: '10px', padding: '4px 12px', opacity: 0.5, fontWeight: 'bold', color: vars.text, textAlign: 'left' }}>{searchResultsLabel.toUpperCase()}</Div>}
              {searchTerm && !filteredOptions.length && <Div onClick={() => handleSelect(searchTerm)} onMouseEnter={() => setHoveredValue(searchTerm)} onMouseLeave={() => setHoveredValue(null)} style={optionStyle(value === searchTerm, hoveredValue === searchTerm)}>"{searchTerm}" Use</Div>}
              {filteredOptions.map((opt: Option) => <Div key={opt.value} onClick={() => handleSelect(opt.value)} onMouseEnter={() => setHoveredValue(opt.value)} onMouseLeave={() => setHoveredValue(null)} style={optionStyle(value === opt.value, hoveredValue === opt.value)}>{renderOption ? renderOption(opt, value === opt.value, hoveredValue === opt.value) : opt.label}</Div>)}
            </>}
          </Div>
        </Div>,
        document.body
      )}
    </Div>
  );

  function optionStyle(isSelected: boolean, isHovered: boolean): React.CSSProperties {
    return { textAlign: 'left', background: isHovered ? `${vars.primary}33` : isSelected ? `${vars.primary}11` : 'transparent', color: vars.text, border: 'none', padding: '6px 12px', cursor: 'pointer', fontSize: '14px', width: '100%', borderRadius: 0, fontWeight: isSelected ? 'bold' : 'normal', display: 'block', boxSizing: 'border-box' };
  }
};

export default SearchableSelect;
