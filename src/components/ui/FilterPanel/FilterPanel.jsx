import React, { useState } from 'react';
import './FilterPanel.css';
import { ChevronDown } from 'lucide-react';

const FilterPanel = ({ className = '', pillGroups = [], selectGroups = [] }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  if (!pillGroups.length && !selectGroups.length) return null;

  return (
    <div className={`filterPanel ${className}`.trim()}>
      {pillGroups.length > 0 && (
        <div className="filterPanel__pills">
          {pillGroups.map((group, groupIndex) => (
            <div
              key={group.id || group.label || `filter-group-${groupIndex}`}
              className="filterPanel__pillGroup"
            >
              {group.label && <span className="filterPanel__groupLabel">{group.label}</span>}
              <div className="filterPanel__chips">
                {group.items.map((item, itemIndex) => (
                  <button
                    key={item.id || item.label || `chip-${groupIndex}-${itemIndex}`}
                    type="button"
                    className={`filterPanel__chip ${item.active ? 'is-active' : ''}`}
                    onClick={item.onClick}
                    aria-pressed={item.active}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {selectGroups.length > 0 && (
        <div className="filterPanel__selects">
          {selectGroups.map((select, selectIndex) => {
            const IconComponent = select.icon;
            const dropdownKey = select.id || select.label || `dropdown-${selectIndex}`;
            const isOpen = openDropdown === dropdownKey;
            const selectedOption =
              select.options.find(option => option.value === select.value) || select.options[0];
            return (
              <label key={select.id || select.label} className="filterPanel__select">
                <span>{select.label}</span>
                <div
                  className={`filterPanel__dropdown ${IconComponent ? 'has-icon' : ''} ${
                    isOpen ? 'is-open' : ''
                  }`.trim()}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  {IconComponent && (
                    <span className="filterPanel__selectIcon">
                      <IconComponent size={16} strokeWidth={1.8} />
                    </span>
                  )}
                  <button
                    type="button"
                    className="filterPanel__dropdownTrigger"
                    onClick={() =>
                      setOpenDropdown(current => (current === dropdownKey ? null : dropdownKey))
                    }
                    disabled={select.disabled}
                  >
                    <span>{selectedOption?.label}</span>
                    <ChevronDown size={16} aria-hidden="true" />
                  </button>
                  <ul className="filterPanel__dropdownList">
                    {select.options.map(option => (
                      <li key={option.value}>
                        <button
                          type="button"
                          className={option.value === select.value ? 'is-active' : ''}
                          onClick={() => {
                            select.onChange({ target: { value: option.value } });
                            setOpenDropdown(null);
                          }}
                          disabled={select.disabled}
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
