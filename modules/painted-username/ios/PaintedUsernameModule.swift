import ExpoModulesCore

public class PaintedUsernameModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PaintedUsername")

    Function("isAvailable") {
      true
    }

    View(PaintedUsernameView.self) {
      Prop("text") { (view: PaintedUsernameView, text: String) in
        view.text = text
      }

      Prop("paint") { (view: PaintedUsernameView, paint: [String: Any]?) in
        view.paintPayload = paint
      }

      Prop("fallbackColor") { (view: PaintedUsernameView, color: String) in
        view.fallbackColor = color
      }

      Prop("fontSize") { (view: PaintedUsernameView, fontSize: Double) in
        view.fontSize = CGFloat(fontSize)
      }

      Prop("lineHeight") { (view: PaintedUsernameView, lineHeight: Double) in
        view.lineHeight = CGFloat(lineHeight)
      }

      Prop("fontWeight") { (view: PaintedUsernameView, fontWeight: String?) in
        view.fontWeight = fontWeight ?? "700"
      }

      Prop("textTransform") { (view: PaintedUsernameView, transform: String?) in
        view.textTransform = transform
      }

      OnViewDidUpdateProps { view in
        view.applyProps()
      }
    }
  }
}
