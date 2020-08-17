import React, { useEffect } from 'react';
import Constants from '../../constants';
import Utils from '../../utils';
import styles from '../../styles/components/ThreeStep/Indicator.module.scss';

const PATH = {
  'bottom': <path d="M0,0 L140,0 L140,105 L40,105 L35,110 L30,105 L0,105 Z" fill="#3d3d3d" />,
  'upper': <path d="M0,110 L0,10 L25,10 L30,5 L35,10 L140,10 L140,110 Z" fill="#3d3d3d" />
};

const TEXT = {
  'download': Constants.bannerStrings.pleaseDownload,
  'install': Constants.bannerStrings.runInstaller
};

let svgRef = React.createRef();
let textRef = React.createRef();

// Dynamically scale indicator text based
let scaleDownloadIndicatorText = (el) => {
  let svg = svgRef.current;
  if (svg && el) {
    let textBBox = svg.getBBox();
    let overflowHeight = el.clientHeight;
    let heightScale = overflowHeight / (textBBox.height - 6);
    // Check if text height is greater than svg height, which means there is overflow
    if (heightScale >= 1) {
      let scale = 1 / heightScale;
      // If text is barely too long, then scale a little more so text isn't right up against the edge
      if (scale >= 0.97) {
        scale = scale - 0.04;
      }
      // Set new font size based on scaled factor
      el.style.fontSize = scale + 'em';
    }
  }
}

export const Indicator = ({ button, position }) => {
  // Triggered when component mounts
  useEffect(() => {
    Utils.sendDownloadIndicatorEvent()
    scaleDownloadIndicatorText(textRef.current);
  });

  let isBottom = position === 'bottom';
  let path = PATH[position];
  let text = TEXT[button];

  return (
    <div className={`${isBottom ? styles.bottom : styles.upper} ${Utils.BROWSER.IE ? styles.ie : null}`}>
      <svg ref={svgRef} className={styles.svg} viewBox="0 0 140 110">{path}</svg>
      <p ref={textRef} className={`${styles.text} ${isBottom ? styles.bottomText : styles.upperText}`}>{text}</p>
    </div>
  );
}
