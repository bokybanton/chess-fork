// Basic chessboard that just renders positions

{

  // For handling the DOM elements of the pieces on the board
  //
  class Pieces {

    constructor(board) {
      this.board = board
      this.$buffer = $("<div>").addClass("piece-buffer")
    }

    reset() {
      this.board.$(".piece").appendTo(this.$buffer)
    }
    
    $getPiece(piece) {
      let className = piece.color + piece.type
      let $piece = this.$buffer.find("." + className).first()
      if ($piece.length) {
        return $piece
      }
      return $("<img>").
        attr("src", `/assets/pieces/${className}.png`).
        addClass(`piece ${className}`)
    }

  }


  class Chessboard extends Backbone.View {

    initialize() {
      this.pieces = new Pieces(this)
    }

    render(fen) {
      if (fen.split(" ").length === 4) {
        fen += " 0 1"
      }
      this.renderFen(fen)
      this.afterRender()
    }

    renderFen(fen) {
      let columns = ['a','b','c','d','e','f','g','h']
      let position = new Chess(fen)
      this.pieces.reset()
      for (let row = 8; row > 0; row--) {
        for (let j = 0; j < 8; j++) {
          let id = columns[j] + row
          let piece = position.get(id)
          if (piece) {
            this.pieces.$getPiece(piece).appendTo(this.$getSquare(id))
          }
        }
      }
    }

    afterRender() {}

    $getSquare(id) {
      return $(`#${this.sqPrefix}-${id}`)
    }

  }


  Components.Chessboard = Chessboard

}
