import { useRef } from 'react';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  }
});

function MemeGenerator() {
  const classes = useStyles();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = () => {
    const canvas = canvasRef.current;
    const imageInput = imageInputRef.current;
    const text = textInputRef.current?.value;

    if (canvas && imageInput?.files?.[0] && text) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.src = URL.createObjectURL(imageInput.files[0]);
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.font = '30px Impact';
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.fillText(text, 20, 50);
          ctx.strokeText(text, 20, 50);
        };
      }
    }
  };

  return (
    <div className={classes.content}>
      <canvas ref={canvasRef} width={400} height={400} />
      <input type="file" ref={imageInputRef} accept="image/*" />
      <input type="text" ref={textInputRef} placeholder="Enter meme text" />
      <button onClick={handleGenerate}>Generate</button>
    </div>
  );
}

export default MemeGenerator;