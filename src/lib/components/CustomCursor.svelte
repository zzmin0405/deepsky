<!-- CustomCursor.svelte
<script>
    import { onMount } from 'svelte';
    let cursorX;
    let cursorY;
    let isClicking = false;
  
    onMount(() => {
      const handleMouseMove = (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
      };
  
      const handleMouseDown = () => {
        isClicking = true;
      };
  
      const handleMouseUp = () => {
        isClicking = false;
      };
  
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
  
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    });
  </script>
  
  <div
    class="custom-cursor"
    style="left: {cursorX}px; top: {cursorY}px; transform: scale({isClicking ? 0.8 : 1})"
  />
  
  <style>
    :global(body) {
      cursor: none;
    }
  
    .custom-cursor {
      width: 20px;
      height: 20px;
      border: 2px solid black;
      border-radius: 50%;
      position: fixed;
      pointer-events: none;
      transition: transform 0.1s ease;
    }
  </style> -->