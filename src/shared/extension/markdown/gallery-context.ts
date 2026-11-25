import { createContext, useContext } from 'react';

/**
 * True while rendering inside a markdown gallery. Images use it to drop
 * their standalone frame (border, padding, large radius) because the
 * gallery card already provides one.
 */
export const InGalleryContext = createContext(false);

export const useInGallery = () => useContext(InGalleryContext);
