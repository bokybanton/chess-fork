// Point and click pieces to select and move them

import store from '../../store'

export default class PointAndClick {

  constructor(board) {
    this.board = board
    this.selectedSquare = false
    this.listenForEvents()
  }

  listenForEvents() {
    this.board.$el.on("click", ".square", event => {
      const squareId = event.currentTarget.dataset.square
      this.selectSquare(squareId)
    })
    store.subscribe(mutation => {
      mutation.type === `setPositionIndex` && this.clearSelected()
    })
  }

  selectSquare(square) {
    if (this.selectedSquare && square != this.selectedSquare) {
      this.board.move({ from: this.selectedSquare, to: square })
      this.clearSelected()
    } else {
      this.selectedSquare = square
    }
  }

  clearSelected() {
    this.selectedSquare = false
  }
}
