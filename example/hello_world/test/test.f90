program test
  use hello_world
  implicit none

  character(:), allocatable :: hello

  hello = say_hello('World')

  if (hello == 'Hello, World!') then
    print *, hello
  else
    print *, "'", hello, "' does not equal 'Hello, World!'"; stop 1
  end if
end
