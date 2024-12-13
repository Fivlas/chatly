"use client";

import React, { useEffect } from "react";
import { SidebarInput } from "@/components/ui/sidebar";

interface SearchInputProps {
    searchQuery: string; // Controlled state from parent
    setSearchQuery: (searchQuery: string) => void; // Updates the parent's state
    // onSearchChange: (debouncedValue: string) => void; // Triggered after debounce
}

const SearchInput: React.FC<SearchInputProps> = ({ searchQuery, setSearchQuery }) => {
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchQuery(searchQuery);
        }, 300);

        return () => clearTimeout(handler);
    }, [searchQuery]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    return (
        <SidebarInput
            placeholder="Type to search or add friend"
            value={searchQuery}
            onChange={handleInputChange}
            className="flex-1 focus-visible:ring-transparent h-full"
        />
    );
};

export default SearchInput;
