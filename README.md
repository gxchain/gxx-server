# GXCC

GXChain smart contract compiler is based on nodejs, provides a compile service for smart contract ide


# Dependency

Install node v6 if it's not exist in your environment

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.30.2/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 6
nvm alias default 6
nvm use 6
```

# Install

```
git clone git@github.com:gxchain/gxcc.git
cd gxcc
npm install
```

# Start

gxcc serves on port 3000 as default

```
npm start
```

# Deploy

```
npm run build
pm2 start dist/index.js --name gxcc
```

# APIS

```
curl -X POST \
  http://localhost:3000/upload \
  -H 'cache-control: no-cache' \
  -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
  -F bundle=@bundle.zip
```

# A basic contract - Hello word

bundle struct

```
.
├── app.json
├── hello.cpp
└── hello.hpp
```

app.json

``` json
{
  "main":"hello.cpp"
}
```

hello.hpp

``` C++
#include <gxblib/gxb.hpp>
```

hello.cpp

``` C++
#include <gxblib/gxb.hpp>

using namespace gxblib;
using namespace graphene;

class hello : public graphene::contract {
  public:
      using contract::contract;

      /// @abi action
      void hi(account_name user) {
          print("Hello, ", user);
      }

      /// @abi action
      void bye(account_name user) {
          for (int i =0; i < 2; ++i) {
              print("Bye, ", user);
          }
      }
};

GXB_ABI(hello, (hi)(bye))
```
