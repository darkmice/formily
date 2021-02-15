import {
  FormPath,
  FormPathPattern,
  isFn,
  isValid,
  toArr,
} from '@formily/shared'
import {
  makeObservable,
  observable,
  action,
  computed,
  IReactionDisposer,
  autorun,
} from 'mobx'
import {
  JSXComponent,
  JSXComponenntProps,
  LifeCycleTypes,
  FieldDisplayTypes,
  FieldPatternTypes,
  FieldDecorator,
  FieldComponent,
  IVoidFieldProps,
  FormPatternTypes,
  IVoidFieldState,
  IModelSetter,
  IModelGetter,
} from '../types'
import {
  buildNodeIndexes,
  createModelStateGetter,
  createModelStateSetter,
  publishUpdate,
} from '../shared'
import { Form } from './Form'
import { Query } from './Query'

export class VoidField<Decorator = any, Component = any, TextType = any> {
  displayName = 'VoidField'

  title: TextType
  description: TextType

  selfDisplay: FieldDisplayTypes
  selfPattern: FieldPatternTypes
  initialized: boolean
  mounted: boolean
  unmounted: boolean

  decoratorType: Decorator
  decoratorProps: Record<string, any>
  componentType: Component
  componentProps: Record<string, any>

  address: FormPath
  path: FormPath
  form: Form
  props: IVoidFieldProps<Decorator, Component>

  private disposers: IReactionDisposer[] = []

  constructor(
    address: FormPathPattern,
    props: IVoidFieldProps<Decorator, Component>,
    form: Form
  ) {
    this.initialize(props, form)
    this.makeIndexes(address)
    this.makeObservable()
    this.makeReactive()
    this.onInit()
  }

  protected makeIndexes(address: FormPathPattern) {
    buildNodeIndexes(this, address)
  }

  protected initialize(
    props: IVoidFieldProps<Decorator, Component>,
    form: Form
  ) {
    this.form = form
    this.props = props
    this.mounted = false
    this.unmounted = false
    this.initialized = false
    this.title = props.title
    this.description = props.description
    this.pattern = this.props.pattern
    this.display = props.display
    this.hidden = this.props.hidden
    this.editable = this.props.editable
    this.disabled = this.props.disabled
    this.readOnly = this.props.readOnly
    this.readPretty = this.props.readPretty
    this.visible = this.props.visible
    this.decorator = toArr(this.props.decorator)
    this.component = toArr(this.props.component)
  }

  protected makeObservable() {
    makeObservable(this, {
      title: observable.ref,
      description: observable.ref,
      selfDisplay: observable.ref,
      selfPattern: observable.ref,
      initialized: observable.ref,
      mounted: observable.ref,
      unmounted: observable.ref,
      decoratorType: observable.ref,
      decoratorProps: observable.shallow,
      componentType: observable.ref,
      componentProps: observable.shallow,
      display: computed,
      pattern: computed,
      editable: computed,
      disabled: computed,
      readOnly: computed,
      readPretty: computed,
      hidden: computed,
      visible: computed,
      setTitle: action,
      setDescription: action,
      setDisplay: action,
      setPattern: action,
      setComponent: action,
      setComponentProps: action,
      setDecorator: action,
      setDecoratorProps: action,
      setState: action,
      onInit: action,
      onMount: action,
      onUnmount: action,
    })
  }

  protected makeReactive() {
    const reactions = toArr(this.props.reactions)
    reactions.forEach((reaction) => {
      if (isFn(reaction)) {
        this.disposers.push(autorun(() => reaction(this)))
      }
    })
  }

  get parent() {
    let parent = this.address.parent()
    let identifier = parent.toString()
    while (!this.form.fields[identifier]) {
      parent = parent.parent()
      identifier = parent.toString()
      if (!identifier) return
    }
    return this.form.fields[identifier]
  }

  get component() {
    return [this.componentType, this.componentProps]
  }

  set component(value: FieldComponent<Component>) {
    const component = toArr(value)
    this.componentType = component[0]
    this.componentProps = component[1] || {}
  }

  get decorator() {
    return [this.decoratorType, this.decoratorProps]
  }

  set decorator(value: FieldDecorator<Decorator>) {
    const decorator = toArr(value)
    this.decoratorType = decorator[0]
    this.decoratorProps = decorator[1] || {}
  }

  get display(): FieldDisplayTypes {
    const parentDisplay = this.parent?.display
    if (isValid(this.selfDisplay)) return this.selfDisplay
    return parentDisplay || this.form.display || 'visible'
  }

  get pattern(): FormPatternTypes {
    const parentPattern = this.parent?.pattern
    if (isValid(this.selfPattern)) return this.selfPattern
    return parentPattern || this.form.pattern || 'editable'
  }

  get editable() {
    return this.pattern === 'editable'
  }

  get disabled() {
    return this.pattern === 'disabled'
  }

  get readOnly() {
    return this.pattern === 'readOnly'
  }

  get readPretty() {
    return this.pattern === 'readPretty'
  }

  get hidden() {
    return this.display === 'hidden'
  }

  get visible() {
    return this.display === 'visible'
  }

  set hidden(hidden: boolean) {
    if (!isValid(hidden)) return
    if (hidden) {
      this.display = 'hidden'
    } else {
      this.display = 'visible'
    }
  }

  set visible(visible: boolean) {
    if (!isValid(visible)) return
    if (visible) {
      this.display = 'visible'
    } else {
      this.display = 'none'
    }
  }

  set editable(editable: boolean) {
    if (!isValid(editable)) return
    if (editable) {
      this.pattern = 'editable'
    } else {
      this.pattern = 'readPretty'
    }
  }

  set readOnly(readOnly: boolean) {
    if (!isValid(readOnly)) return
    if (readOnly) {
      this.pattern = 'readOnly'
    } else {
      this.pattern = 'editable'
    }
  }

  set disabled(disabled: boolean) {
    if (!isValid(disabled)) return
    if (disabled) {
      this.pattern = 'disabled'
    } else {
      this.pattern = 'editable'
    }
  }

  set readPretty(readPretty: boolean) {
    if (!isValid(readPretty)) return
    if (readPretty) {
      this.pattern = 'readPretty'
    } else {
      this.pattern = 'editable'
    }
  }

  set pattern(pattern: FieldPatternTypes) {
    this.selfPattern = pattern
  }

  set display(display: FieldDisplayTypes) {
    this.selfDisplay = display
  }

  setTitle = (title?: TextType) => {
    this.title = title
  }

  setDescription = (description?: TextType) => {
    this.description = description
  }

  setDisplay = (type?: FieldDisplayTypes) => {
    this.display = type
  }

  setPattern = (type?: FieldPatternTypes) => {
    this.pattern = type
  }

  setComponent = <C extends JSXComponent>(
    component?: C,
    props?: JSXComponenntProps<C>
  ) => {
    if (component) {
      this.componentType = component as any
    }
    if (props) {
      this.componentProps = this.componentProps || {}
      Object.assign(this.componentProps, props)
    }
  }

  setComponentProps = <C extends JSXComponent = Component>(
    props?: JSXComponenntProps<C>
  ) => {
    if (props) {
      this.componentProps = this.componentProps || {}
      Object.assign(this.componentProps, props)
    }
  }

  setDecorator = <D extends JSXComponent>(
    component?: D,
    props?: JSXComponenntProps<D>
  ) => {
    if (component) {
      this.decoratorType = component as any
    }
    if (props) {
      this.decoratorProps = this.decoratorProps || {}
      Object.assign(this.decoratorProps, props)
    }
  }

  setDecoratorProps = <D extends JSXComponent = Decorator>(
    props?: JSXComponenntProps<D>
  ) => {
    if (props) {
      this.decoratorProps = this.decoratorProps || {}
      Object.assign(this.decoratorProps, props)
    }
  }

  setState: IModelSetter<IVoidFieldState> = createModelStateSetter(this)

  getState: IModelGetter<IVoidFieldState> = createModelStateGetter(this)

  onInit = () => {
    this.initialized = true
    this.form.notify(LifeCycleTypes.ON_FIELD_INIT, this)
    publishUpdate(this)
  }

  onMount = () => {
    this.mounted = true
    this.unmounted = false
    this.form.notify(LifeCycleTypes.ON_FIELD_MOUNT, this)
  }

  onUnmount = () => {
    this.mounted = false
    this.unmounted = true
    this.form.notify(LifeCycleTypes.ON_FIELD_UNMOUNT, this)
  }

  query = (pattern: FormPathPattern | RegExp) => {
    return new Query({
      pattern,
      base: this.address,
      form: this.form,
    })
  }

  dispose = () => {
    this.disposers.forEach((dispose) => {
      dispose()
    })
  }

  match = (pattern: FormPathPattern) => {
    return FormPath.parse(pattern).matchAliasGroup(this.address, this.path)
  }
}
