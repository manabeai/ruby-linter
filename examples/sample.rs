// use wasm_bindgen::prelude::*;

// #[wasm_bindgen]
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

// rubyのソースコードを文字列で受取、prismでparseしてデバッグ情報出す
// #[wasm_bindgen]
pub fn parse_ruby(source: &str) -> String {
    let mut res = ruby_prism::parse(source.as_bytes());

    dbg!(&res);
    return  String::from("parse_ruby");
}

fn main() {
    let source = "
    class Foo
      def initialize(bar)
        @bar = bar
      end
    end
    ";

    let result = ruby_prism::parse(source.as_bytes());
    let src = result.source();
    let errors = result.errors();
    let warnings = result.warnings();
    // let s = result.as_slice(location::new(0, 0));
    println!("Result: {:?}", result);
    println!("Source: {:?}", src);
    // dbg!(errors);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }

    #[test]
    fn test_parse_ruby() {
        let source = "
class Foo
  def initialize(bar)
    @bar = bar
  end
end
";
        let result = parse_ruby(source);
        assert_eq!(result, "parse_ruby");
    }
}
