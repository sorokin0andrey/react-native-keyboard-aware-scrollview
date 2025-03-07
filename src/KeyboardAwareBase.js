
import React , { Component } from 'react';
import PropTypes from 'prop-types';


import ReactNative, {
  DeviceEventEmitter,
  Keyboard,
  NativeModules,
  TextInput,
  findNodeHandle,
} from 'react-native';

const ScrollViewManager = NativeModules.ScrollViewManager;

export default class KeyboardAwareBase extends Component {
  constructor(props) {
    super(props);
    this._bind('_onKeyboardWillShow', '_onKeyboardWillHide', '_addKeyboardEventListeners', '_removeKeyboardListeners', '_scrollToFocusedTextInput', '_onKeyboardAwareViewLayout', 'scrollToBottom', 'scrollBottomOnNextSizeChange');
    this.state = {keyboardHeight: 0};
  }
  
  _bind(...methods) {
    methods.forEach((method) => {
      this[method] = this[method].bind(this);
    });
  }
  
  _addKeyboardEventListeners() {
    const KeyboardEventsObj = Keyboard || DeviceEventEmitter;
    this.keyboardEventListeners = [
      KeyboardEventsObj.addListener('keyboardWillShow', this._onKeyboardWillShow),
      KeyboardEventsObj.addListener('keyboardWillHide', this._onKeyboardWillHide)
    ];
  }
  
  _removeKeyboardListeners() {
    this.keyboardEventListeners.forEach((eventListener) => eventListener.remove());
  }
  
  componentWillMount() {
    this._addKeyboardEventListeners();
  }

  componentDidMount() {
    if(this._keyboardAwareView && this.props.startScrolledToBottom) {
      this.scrollToBottom(false);
      setTimeout(() => this._keyboardAwareView.setNativeProps({ opacity: 1 }), 100);
    }
  }

  _onKeyboardAwareViewLayout(layout) {
    this._keyboardAwareView.layout = layout;
    this._keyboardAwareView.contentOffset = {x: 0, y: 0};
    this._updateKeyboardAwareViewContentSize();
  }

  _onKeyboardAwareViewScroll(contentOffset) {
    this._keyboardAwareView.contentOffset = contentOffset;
    this._updateKeyboardAwareViewContentSize();
  }

  _updateKeyboardAwareViewContentSize() {
    if(ScrollViewManager && ScrollViewManager.getContentSize) {
      ScrollViewManager.getContentSize(ReactNative.findNodeHandle(this._keyboardAwareView), (res)=> {
        if(this._keyboardAwareView) {
          this._keyboardAwareView.contentSize = res;
          if(this.state.scrollBottomOnNextSizeChange) {
            this.scrollToBottom();
            this.state.scrollBottomOnNextSizeChange = false;
          }
        }
      })
    }
  }

  componentWillUnmount() {
    this._removeKeyboardListeners();
  }
  
  _scrollToFocusedTextInput() {
    const currentlyFocusedField = TextInput.State.currentlyFocusedField()
    if (currentlyFocusedField) {
      setTimeout(() => {
        this._keyboardAwareView.getScrollResponder().scrollResponderScrollNativeHandleToKeyboard(
          currentlyFocusedField, this.props.scrollToInputAdditionalOffset, true);
      }, 0);
    }
  }

  _scrollToView(ref, offset = 0) {
    if (ref) {
      setTimeout(() => {
        this._keyboardAwareView.getScrollResponder().scrollResponderScrollNativeHandleToKeyboard(
          findNodeHandle(ref), offset || this.props.scrollToInputAdditionalOffset, true);
      }, 0);
    }
  }
  
  _onKeyboardWillShow(event) {
    const newKeyboardHeight = event.endCoordinates.height;
    if (this.state.keyboardHeight === newKeyboardHeight) {
      return;
    }
    
    this.setState({keyboardHeight: newKeyboardHeight});

    if(this.props.scrollToBottomOnKBShow) {
      this.scrollToBottom();
    }
  }

  _onKeyboardWillHide(event) {
    const keyboardHeight = this.state.keyboardHeight;
    this.setState({keyboardHeight: 0});

    const hasYOffset = this._keyboardAwareView && this._keyboardAwareView.contentOffset && this._keyboardAwareView.contentOffset.y !== undefined;
    const yOffset = hasYOffset ? Math.max(this._keyboardAwareView.contentOffset.y - keyboardHeight, 0) : 0;
    this._keyboardAwareView.scrollTo({x: 0, y: yOffset, animated: true});
  }

  scrollBottomOnNextSizeChange() {
    this.state.scrollBottomOnNextSizeChange = true;
  }

  scrollToBottom(scrollAnimated = true) {
    if (this._keyboardAwareView) {

      if(!this._keyboardAwareView.contentSize) {
        setTimeout(() => this.scrollToBottom(scrollAnimated), 50);
        return;
      }

      const bottomYOffset = this._keyboardAwareView.contentSize.height - this._keyboardAwareView.layout.height + this._keyboardAwareView.props.contentInset.bottom;
      this._keyboardAwareView.scrollTo({x: 0, y: bottomYOffset, animated: scrollAnimated});
    }
  }
  scrollTo(options) {
    if (this._keyboardAwareView) this._keyboardAwareView.scrollTo(options);
  }
}

KeyboardAwareBase.propTypes = {
  startScrolledToBottom: PropTypes.bool,
  scrollToBottomOnKBShow: PropTypes.bool,
  scrollToInputAdditionalOffset: PropTypes.number
};
KeyboardAwareBase.defaultProps = {
  startScrolledToBottom: false,
  scrollToBottomOnKBShow: false,
  scrollToInputAdditionalOffset: 75
};
