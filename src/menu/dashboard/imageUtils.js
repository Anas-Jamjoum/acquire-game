export const importAllImages = (r) => {
    let images = {};
    r.keys().forEach((item, index) => {
      images[item.replace('./', '')] = r(item);
    });
    return images;
  };
  
  // Import all images from the profilePicture directory
  const images = importAllImages(require.context('./profilePicture', false, /\.(png|jpe?g|svg)$/));
  
  export default images;