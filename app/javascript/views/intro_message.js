// The intro message under the board before user makes an action

import $ from 'jquery'
import Backbone from 'backbone'

import { world } from '../world_state'

export default class IntroMessage extends Backbone.View {

  get el() {
    return ".intro-message"
  }

  initialize() {
    $(() => this.$el.removeClass("invisible"))
    this.listenTo(world, "change:i", () => this.$el.fadeOut(50))
  }
}
