/** 캔버스 undo/redo 히스토리 */
export class CanvasHistory {
  private stack: string[] = [];
  private index = -1;
  private maxSize = 40;

  push(json: string) {
    if (this.index < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.index + 1);
    }
    if (this.stack[this.index] === json) return;
    this.stack.push(json);
    if (this.stack.length > this.maxSize) {
      this.stack.shift();
    } else {
      this.index++;
    }
  }

  canUndo() {
    return this.index > 0;
  }

  canRedo() {
    return this.index < this.stack.length - 1;
  }

  undo(): string | null {
    if (!this.canUndo()) return null;
    this.index--;
    return this.stack[this.index] ?? null;
  }

  redo(): string | null {
    if (!this.canRedo()) return null;
    this.index++;
    return this.stack[this.index] ?? null;
  }

  reset(json: string) {
    this.stack = [json];
    this.index = 0;
  }
}
