import React from "react";
import { Fade } from "react-slideshow-image";
import "react-slideshow-image/dist/styles.css";
import "./styles.css";

export const ImageSlider = (props) => {
  const { images } = props;

  return (
    <div className="slide-container" style={{ width: '500px' }}>
      <Fade>
        {images.map((image) => (
          <div className="each-fade">
            <img width="500px" src={image.upload} />
          </div>
        ))}
      </Fade>
    </div>
  );
}
