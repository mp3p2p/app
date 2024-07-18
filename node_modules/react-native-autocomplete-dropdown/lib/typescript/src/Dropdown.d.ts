import React from 'react';
import type { ListRenderItem } from 'react-native';
import type { AutocompleteDropdownItem, IAutocompleteDropdownProps } from './types';
interface DropdownProps extends Omit<IAutocompleteDropdownProps, 'renderItem' | 'ref'> {
    ListEmptyComponent: JSX.Element;
    renderItem: ListRenderItem<AutocompleteDropdownItem>;
}
export declare const Dropdown: React.MemoExoticComponent<(props: DropdownProps) => React.JSX.Element>;
export {};
//# sourceMappingURL=Dropdown.d.ts.map