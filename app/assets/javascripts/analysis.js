$(function() {


  // Handling the internal state of chess positions/history
  //
  var ChessMechanism = Backbone.Model.extend({

    initialize: function() {
      this.mechanism = new Chess;
      this.i = 0;
      this.set({
        moves: [],
        positions: [this.mechanism.fen()]
      });
    },

    setFen: function(fen) {
      this.set({ fen: fen });
    },

    start: function() {
      this.setFen(this.mechanism.fen());
    },

    move: function(move) {
      var moves = this.get('moves').slice(0, this.i);
      var c = new Chess;
      var positions = [c.fen()];
      _.each(moves, function(move) {
        c.move(move);
        positions.push(c.fen());
      });
      var nextMove = c.move(move);
      if (!nextMove) {
        return;
      }
      moves.push(nextMove.san);
      this.mechanism = c;
      this.setFen(c.fen());
      this.updatePositions(c.history());
      this.i++;
    },

    // TODO DRY usage of new chess instance to generate a
    // different state and position set
    //
    updatePositions: function(moves) {
      var c = new Chess;
      var positions = [c.fen()];
      _.each(moves, function(move) {
        c.move(move);
        positions.push(c.fen());
      });
      this.set({
        moves: moves,
        positions: positions
      });
    },

    getMovePrefix: function() {
      var nMoves = this.i;
      var moveNum = 1 + ~~(nMoves / 2);
      return moveNum + (nMoves % 2 == 0 ? "." : "...");
    },

    loadPgn: function(pgn) {
      if (!this.mechanism.load_pgn(pgn)) {
        return false;
      }
      this.updatePositions(this.mechanism.history());
      this.firstMove();
      return true;
    },

    firstMove: function() {
      this.i = 0;
      this._loadPosition(this.i);
    },

    prevMove: function() {
      if (this.i > 0) {
        this.i--;
      }
      this._loadPosition(this.i);
    },

    nextMove: function() {
      if (this.i < this.get("positions").length - 1) {
        this.i++;
      }
      this._loadPosition(this.i);
    },

    lastMove: function() {
      this.i = this.get("positions").length - 1;
      this._loadPosition(this.i);
    },

    _loadPosition: function(i) {
      console.log(i);
      this.setFen(this.get("positions")[i]);
    }

  });


  // For handling the DOM elements of the pieces on the board
  //
  var Pieces = function(board) {
    this.board = board;
    this.$buffer = $("<div>").addClass("piece-buffer");

    this.reset = function() {
      this.board.$(".piece").appendTo(this.$buffer);
    };

    this.$getPiece = function(piece) {
      var className = piece.color + piece.type;
      var $piece = this.$buffer.find("." + className).first();
      if ($piece.length) {
        return $piece;
      }
      return $("<img>").
        attr("src", "/assets/pieces/" + className + ".png").
        addClass("piece " + className);
    };

  };


  // The chessboard, which reflects the current state of the
  // chess mechanism
  //
  var Chessboard = Backbone.View.extend({

    el: ".chessboard",

    initialize: function() {
      this.pieces = new Pieces(this);
      this.listenTo(chess, "change:fen", function(model, fen) {
        this.render(fen);
      });
    },

    render: function(fen) {
      if (fen.split(" ").length === 4) {
        fen += "0 1";
      }
      this.renderFen(fen);
      this.initDragDrop();
    },

    renderFen: function(fen) {
      var id, piece, $square;
      var columns = ['a','b','c','d','e','f','g','h'];
      var position = new Chess(fen);
      this.pieces.reset();
      for (var row = 8; row > 0; row--) {
        for (var j = 0; j < 8; j++) {
          id = columns[j] + row;
          piece = position.get(id);
          if (piece) {
            this.pieces.$getPiece(piece).appendTo(this.$getSquare(id));
          }
        }
      }
    },

    $getSquare: function(id) {
      return $("#" + id);
    },

    initDragDrop: _.once(function() {
      this.$(".piece").draggable({
        stack: ".piece",
        revert: true,
        revertDuration: 0
      });
      this.$(".square").droppable({
        accept: ".piece",
        tolerance: "pointer",
        drop: function(event, ui) {
          var move = {
            from: $(ui.draggable).parents(".square").attr("id"),
            to: $(event.target).attr("id")
          };
          chess.move(move);
        }
      });
    })

  });


  // For handling the manual import of a chess game
  //
  var PgnImporter = Backbone.View.extend({

    el: ".pgn-importer",

    events: {
      "keyup textarea"   : "_validatePgn",
      "click .load-pgn"  : "_loadPgn"
    },

    initialize: function() {
      this.$textarea = this.$("textarea");
      this.$button = this.$(".load-pgn");
      this.validator = new Chess;
    },

    pgn: function() {
      return this.$textarea.val();
    },

    _validatePgn: function() {
      if (this.validator.load_pgn(this.pgn())) {
        this.$button.removeClass("invisible");
      } else {
        this.$button.addClass("invisible");
      }
    },

    _loadPgn: function() {
      if (chess.loadPgn(this.pgn())) {
        this.$el.hide();
      }
    }

  });


  // Clickable list of moves that represent the state
  // of the game
  //
  var MoveList = Backbone.View.extend({

    el: ".move-list",

    initialize: function() {
      this.listenTo(chess, "change:moves", function(model, moves) {
        this.render(moves);
      });
    },

    render: function(moves) {
      this.$el.empty();
      var moveNum = 1;
      var plyNum = 0;
      var html = '';
      _.each(moves, function(move) {
        if (plyNum % 2 === 0) {
          html += '<div class="move-num">' + moveNum + '.</div>';
          moveNum++;
        }
        html += '<div class="move" data-ply="' + plyNum + '">' + move + '</div>';
        plyNum++;
      });
      this.$el.html(html);
    }

  });


  // The set of action buttons under the move list
  //
  var ActionButtons = Backbone.View.extend({

    el: ".actions",

    events: {
      "click .first-move" : "_firstMove",
      "click .prev-move"  : "_prevMove",
      "click .next-move"  : "_nextMove",
      "click .last-move"  : "_lastMove",
    },

    _firstMove: function() {
      chess.firstMove();
    },

    _prevMove: function() {
      chess.prevMove();
    },

    _nextMove: function() {
      chess.nextMove();
    },

    _lastMove: function() {
      chess.lastMove();
    }

  });


  var AnalysisHandler = function() {

    var $suggested = $(".suggested-moves");

    var renderAnalysis = function(analysis) {
      var sourceStr = analysis.engine + " - depth " + analysis.depth;
      $suggested.removeClass("invisible");
      $suggested.find(".move").text(chess.getMovePrefix() + " " + analysis.san);
      $suggested.find(".evaluation").text(analysis.evaluation);
      $suggested.find(".source").text(sourceStr);
    };

    var observer = _.clone(Backbone.Events);

    observer.listenTo(chess, "change:fen", function(model, fen) {
      $.post("/analysis", { fen: fen }, function(response) {
        var c = new Chess;
        c.load(fen);
        var bestmove = response.bestmove;
        var move = c.move({ from: bestmove.slice(0,2), to: bestmove.slice(2,5) });
        var analysis = {
          engine: "Stockfish 6",
          san: move.san,
          evaluation: response.score,
          depth: response.depth
        }
        renderAnalysis(analysis);
        console.log(move.san);
      });
    });

  };


  var chess = window.chess = new ChessMechanism;
  var chessboard = window.chessboard = new Chessboard;
  chess.start();

  new PgnImporter;
  new MoveList;
  new ActionButtons;
  new AnalysisHandler;

});
