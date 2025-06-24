# Ruby code that generates warnings

# Duplicated when clause
case x
when 1
  puts "one"
when 1  # This will generate a warning
  puts "one again"
when 2
  puts "two"
end

# Unused variables (might generate warnings in some contexts)
def unused_vars
  unused_var = 42
  another_unused = "hello"
  puts "Done"
end

# Ambiguous regexp literal
p /regexp/

# Possibly useless use of a variable in void context
def void_context
  x = 10
  x  # This value is not used
  puts "End"
end

# Shadowing outer local variable
x = 1
[1, 2, 3].each do |x|  # Shadows outer x
  puts x
end

# Integer with leading zeros (deprecated in newer Ruby)
num = 0123

# END in method
def method_with_end
  END { puts "END block" }
end