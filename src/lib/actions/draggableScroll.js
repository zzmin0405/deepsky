// 가로로 긴 목록을 마우스로 끌어서 스크롤하는 Svelte action입니다.
// 끌기를 마친 직후 발생하는 클릭은 항목 선택으로 처리하지 않도록 막습니다.
const DRAG_THRESHOLD_PX = 4;

/** @param {HTMLElement} node */
export function draggableScroll(node) {
	let isDragging = false;
	let hasDragged = false;
	let suppressClick = false;
	let startX = 0;
	let startScrollLeft = 0;

	function handlePointerDown(event) {
		if (event.pointerType === 'mouse' && event.button !== 0) return;

		isDragging = true;
		hasDragged = false;
		startX = event.clientX;
		startScrollLeft = node.scrollLeft;
		node.classList.add('dragging');
		node.setPointerCapture?.(event.pointerId);
	}

	function handlePointerMove(event) {
		if (!isDragging) return;

		const distance = event.clientX - startX;
		if (Math.abs(distance) > DRAG_THRESHOLD_PX) {
			hasDragged = true;
			event.preventDefault();
		}
		node.scrollLeft = startScrollLeft - distance;
	}

	function finishDrag(event) {
		if (!isDragging) return;

		isDragging = false;
		node.classList.remove('dragging');
		node.releasePointerCapture?.(event.pointerId);

		// 끌기 직후 같은 작업 안에서 오는 click만 막고, 다음 클릭부터는 정상 처리합니다.
		if (hasDragged) {
			suppressClick = true;
			setTimeout(() => (suppressClick = false), 0);
		}
	}

	function handleClickCapture(event) {
		if (!suppressClick) return;
		event.stopPropagation();
		event.preventDefault();
	}

	node.addEventListener('pointerdown', handlePointerDown);
	node.addEventListener('pointermove', handlePointerMove);
	node.addEventListener('pointerup', finishDrag);
	node.addEventListener('pointercancel', finishDrag);
	node.addEventListener('pointerleave', finishDrag);
	node.addEventListener('click', handleClickCapture, true);

	return {
		destroy() {
			node.removeEventListener('pointerdown', handlePointerDown);
			node.removeEventListener('pointermove', handlePointerMove);
			node.removeEventListener('pointerup', finishDrag);
			node.removeEventListener('pointercancel', finishDrag);
			node.removeEventListener('pointerleave', finishDrag);
			node.removeEventListener('click', handleClickCapture, true);
		}
	};
}
