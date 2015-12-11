{

  class HotKeys {

    constructor() {
      Mousetrap.bind(["left"],  () => { chess.prevMove() })
      Mousetrap.bind(["right"], () => { chess.nextMove() })
      Mousetrap.bind(["up"],    () => { chess.prevEngineMove() })
      Mousetrap.bind(["down"],  () => { chess.nextEngineMove() })
      Mousetrap.bind(["esc"],   () => { chess.set({ mode: "normal" }) })

      Mousetrap.bind(["command+z", "ctrl+z"], () => {
        chronicle.rewind()
      })
    }

  }


  Components.HotKeys = HotKeys

}
