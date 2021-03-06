<div align="center">
<h1>Hexagonal Architecture JavaScript</h1>
<h4>Simple implementation of hexagonal architecture in JavaScript on top of <a href="https://nodejs.org/en/" target="_blank">NodeJS</a></h4>
</div>

> Hexagonal Architecture defines that an application’s business logic should be isolated from the external applications.

> The main goal of this architecture is to avoid knows structural pitfalls in software design. Such as the pollution of UI code with business logic or undesired dependencies between layers. Therefore it aims at creating loosely coupled components that can be connected to their software environments using “ports” and “adapters”.

<details>
<summary>📖 <b>Table of Contents</b></summary>
<br />

[![-----------------------------------------------------][colored-line]](#table-of-contents)

## ➤ Table of Contents

* [➤ Walkthrough](#-walkthrough)
	* [Built With](#built-with)
	* [Introduction](#introduction)
	* [Domain Object](#domain-object)
	* [Use Cases](#use-cases)
	* [Ports](#ports)
	* [Adapters](#adapters)
	* [File Structure](#file-structure)
* [➤ Example](#-example)
* [➤ Getting Started](#-getting-started)
</details>

[![-----------------------------------------------------][colored-line]](#installation)

## ➤ Walkthrough


### Built With

- [Node JS](https://nodejs.org/en/)


### Introduction
The term “Hexagonal Architecture” stems from Alistair Cockburn and has been around for quite some time14. It applies the same principles that Robert C. Martin later described in more general terms in his Clean Architecture.

<div align="center">
	<a href=""><img src="./.docs/diag.png" alt="Diagram" /></a>
</div>

Within the hexagon, we find our domain entities and the use cases that work with them. Note that the hexagon has no outgoing dependencies, so that the Dependency Rule from Martin’s Clean Architecture holds true. Instead, all dependencies point towards the center.

Outside of the hexagon, we find various adapters that interact with the application. There might be a web adapter that interacts with a web browser, some adapters interacting with external systems and an adapter that interacts with a database.

**The adapters on the left side are adapters that drive our application (because they call our application core) while the adapters on the right side are driven by our application (because they are called by our application core).**

**To allow communication between the application core and the adapters, the application core provides specific ports.** For driving adapters, such a port might be an interface that is implemented by one of the use case classes in the core and called by the adapter. For a driven adapter, it might be an interface that is implemented by the adapter and called by the core.

The domain code has no dependencies to the outside so we can decouple our domain logic from all those persistence and UI specific problems and reduce the
number of reasons to change throughout the codebase. And less reasons to change means better maintainability.

The domain code is free to be modelled as best fits the business problems while the persistence and UI code are free to be modelled as best fits the persistence and UI problems.

### Domain Object

The domain object is the core part of the application. It can have both state and behaviour. However, it doesn’t have any outward dependency. So any change in the other layers has no impact on the domain object.

The domain object changes only if there is a change in the business requirement. Hence, this is an example of the Single Responsibility Principle among the SOLID principles of software design.

**Example of domain objects:** Suppose we are building a library application, **Book**, **User** can be a domains of our application. Similarly, in a financial application, **Account** can be a domain object.

Domain object is directly linked to business requirements and it should only be changed when the requirement changes. No other changes should be the reason to change domain object.

```java
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Account {

  @Getter private final AccountId id;

  @Getter private final Money baselineBalance;

  @Getter private final ActivityWindow activityWindow;

  public static Account account(
          AccountId accountId,
          Money baselineBalance,
          ActivityWindow activityWindow) {
    return new Account(accountId, baselineBalance, activityWindow);
  }

  public Optional<AccountId> getId(){
    return Optional.ofNullable(this.id);
  }

  public Money calculateBalance() {
    return Money.add(
        this.baselineBalance,
        this.activityWindow.calculateBalance(this.id));
  }

  public boolean withdraw(Money money, AccountId targetAccountId) {

    if (!mayWithdraw(money)) {
      return false;
    }

    Activity withdrawal = new Activity(
        this.id,
        this.id,
        targetAccountId,
        LocalDateTime.now(),
        money);
    this.activityWindow.addActivity(withdrawal);
    return true;
  }

  private boolean mayWithdraw(Money money) {
    return Money.add(
        this.calculateBalance(),
        money.negate())
        .isPositiveOrZero();
  }

  public boolean deposit(Money money, AccountId sourceAccountId) {
    Activity deposit = new Activity(
        this.id,
        sourceAccountId,
        this.id,
        LocalDateTime.now(),
        money);
    this.activityWindow.addActivity(deposit);
    return true;
  }

  @Value
  public static class AccountId {
    private Long value;
  }

}
```

An Account can have many associated Activitys that each represents a withdrawal or a deposit to that account. Since we don’t always want to load all activities for a given account, we limit it to a certain ActivityWindow. To still be able to calculate the total balance of the account, the Account class has the baselineBalance attribute containing the balance of the account at the start time of the activity window.

As you can see in the code above, we build our domain objects completely free of dependencies to the other layers of our architecture. We’re free to model the code how we see fit, in this case creating a “rich” behavior that is very close to the state of the model to make it easier to understand.

We can use external libraries in our domain model if we choose to, but those dependencies should be relatively stable to prevent forced changes to our code. In the case above, we included Lombok annotations, for instance.

The Account class now allows us to withdraw and deposit money to a single account, but we want to transfer money between two accounts. So, we create a use case class that orchestrates this for us.

### Use Cases

We know use cases as abstract descriptions of what users are doing with our software. In the hexagonal architecture style, it makes sense to promote use cases to first-class citizens of our codebase.

First, let’s discuss what a use case actually does. Usually, it follows these steps:

* Take input
* Validate business rules
* Manipulate model state
* Return output

A use case in this sense is a class that handles everything around, well, a certain use case. As an example let’s consider the use case “Send money from one account to another” in a banking application. We’d create a class SendMoneyUseCase with a distinct API that allows a user to transfer money. The code contains all the business rule validations and logic that are specific to the use case and thus cannot be implemented within the domain objects. Everything else is delegated to the domain objects (there might be a domain object Account, for instance).

Similar to the domain objects, a use case class has no dependency on outward components. When it needs something from outside of the hexagon, we create an output port.

A use case takes input from an incoming adapter. If the business rules were satisfied, the use case then manipulates the state of the model in one way or another, based on the input. Usually, it will change the state of a domain object and pass this new state to a port implemented by the persistence adapter to be persisted. A use case might also call any other outgoing adapter, though.

The last step is to translate the return value from the outgoing adapter into an output object which will be returned to the calling adapter.

While **validating input is not part of the use case logic**, validating business rules definitely is. Business rules are the core of the application and should be handled with appropriate care.

A very pragmatic distinction between the two is that validating a business rule requires access to the current state of the domain model while validating input does not. Input validation can be implemented declaratively, such as `amount` should not be null when sending money, while a business rule needs more context.

We might also say that input validation is a syntactical validation, while a business rule is a semantical validation in the context of a use case.

Let’s take the rule “the source account must not be overdrawn”. By the definition above, this is a business rule since it needs access to the current state of the model to check if the source and target accounts do exist. **The best way is to do put the business rules into a domain entity.**

In contrast, the rule “the transfer amount must be greater than zero” can be validated without access to the model and thus can be implemented as part of the input validation (**this type of validations should be put inside the implementation of input port for use case**).

### Ports
The ports are interfaces that allow inbound and outbound flow. Therefore, the core part of the application communicates with the outside part using the dedicated ports.

The domain objects and use cases are within the hexagon, i.e. within the core of the application. Every communication to and from the outside happens through dedicated “ports”.

#### Input Ports (Inbound Ports)

The inbound port exposes the core application to the outside. It is an interface that can be called by the outside components. These outside components calling an inbound port are called primary or input adapters.

**Examples:** In a banking application, examples of input port inside account service (implemented by account use case) are: get account by ID, add account, remove account.

```java
public interface SendMoneyUseCase {

  boolean sendMoney(SendMoneyCommand command);

  @Value
  @EqualsAndHashCode(callSuper = false)
  class SendMoneyCommand extends SelfValidating<SendMoneyCommand> {

    @NotNull
    private final AccountId sourceAccountId;

    @NotNull
    private final AccountId targetAccountId;

    @NotNull
    private final Money money;

    public SendMoneyCommand(
        AccountId sourceAccountId,
        AccountId targetAccountId,
        Money money) {
      this.sourceAccountId = sourceAccountId;
      this.targetAccountId = targetAccountId;
      this.money = money;
      this.validateSelf();
    }
  }

}
```

By calling sendMoney(), an adapter outside of our application core can now invoke this use case.

We aggregated all the parameters we need into the SendMoneyCommand value object. This allows us to do the input validation in the constructor of the value object. In the example above we even used the Bean Validation annotation @NotNull, which is validated in the validateSelf() method. This way the actual use case code is not polluted with noisy validation code.

Now we need an implementation of this interface.

#### Output Ports (Outbound Ports)

The outbound port allows outside functionality to the core application. It is an interface that enables the use case of the core application to communicate with the outside such as database access. Hence, the outbound port is implemented by the outside components which are called secondary or output adapters.

**Examples:** In a banking application, a simple example of output port is that which fetches account from database by ID provided from input port. Another example is that which adds a new account in database with details provided by input port.

```java
@RequiredArgsConstructor
@Component
@Transactional
public class SendMoneyService implements SendMoneyUseCase {

  private final LoadAccountPort loadAccountPort;
  private final AccountLock accountLock;
  private final UpdateAccountStatePort updateAccountStatePort;

  @Override
  public boolean sendMoney(SendMoneyCommand command) {

    LocalDateTime baselineDate = LocalDateTime.now().minusDays(10);

    Account sourceAccount = loadAccountPort.loadAccount(
        command.getSourceAccountId(),
        baselineDate);

    Account targetAccount = loadAccountPort.loadAccount(
        command.getTargetAccountId(),
        baselineDate);

    accountLock.lockAccount(sourceAccountId);
    if (!sourceAccount.withdraw(command.getMoney(), targetAccountId)) {
      accountLock.releaseAccount(sourceAccountId);
      return false;
    }

    accountLock.lockAccount(targetAccountId);
    if (!targetAccount.deposit(command.getMoney(), sourceAccountId)) {
      accountLock.releaseAccount(sourceAccountId);
      accountLock.releaseAccount(targetAccountId);
      return false;
    }

    updateAccountStatePort.updateActivities(sourceAccount);
    updateAccountStatePort.updateActivities(targetAccount);

    accountLock.releaseAccount(sourceAccountId);
    accountLock.releaseAccount(targetAccountId);
    return true;
  }

}
```

Basically, the use case implementation loads the source and target account from the database, locks the accounts so that no other transactions can take place at the same time, makes the withdrawal and deposit, and finally writes the new state of the accounts back to the database.

Also, by using @Component, we make this service a Spring bean to be injected into any components that need access to the SendMoneyUseCase input port without having a dependency on the actual implementation.

For loading and storing the accounts from and to the database, the implementation depends on the output ports LoadAccountPort and UpdateAccountStatePort, which are interfaces that we will later implement within our persistence adapter.

The shape of the output port interfaces is dictated by the use case. While writing the use case we may find that we need to load certain data from the database, so we create an output port interface for it. Those ports may be re-used in other use cases, of course. In our case, the output ports look like this:

```java
public interface LoadAccountPort {

  Account loadAccount(AccountId accountId, LocalDateTime baselineDate);

}
```

```java
public interface UpdateAccountStatePort {

  void updateActivities(Account account);

}
```

### Adapters

The adapters form the outer layer of the hexagonal architecture. They are not part of the core but interact with it. They interact with the core application only by using the inbound and outbound ports.

#### Primary Adapters (Input Adapters)

The Primary adapters are also known as input or driving adapters. Input adapters or “driving” adapters call the input ports to get something done. An input adapter could be a web interface, for instance. When a user clicks a button in a browser, the web adapter calls a certain input port to call the corresponding use case.

**Examples:**

```java
@RestController
@RequiredArgsConstructor
public class SendMoneyController {

  private final SendMoneyUseCase sendMoneyUseCase;

  @PostMapping(path = "/accounts/send/{sourceAccountId}/{targetAccountId}/{amount}")
  void sendMoney(
      @PathVariable("sourceAccountId") Long sourceAccountId,
      @PathVariable("targetAccountId") Long targetAccountId,
      @PathVariable("amount") Long amount) {

    SendMoneyCommand command = new SendMoneyCommand(
        new AccountId(sourceAccountId),
        new AccountId(targetAccountId),
        Money.of(amount));

    sendMoneyUseCase.sendMoney(command);
  }

}
```

#### Secondary Adapters (Output Adapters)

The Secondary adapters are also known as output or driven adapters. These are implementations of the outbound port interface.

Output adapters or “driven” adapters are called by our use cases and might, for instance, provide data from a database. An output adapter implements a set of output port interfaces. Note that the interfaces are dictated by the use cases and not the other way around.

The adapters make it easy to exchange a certain layer of the application. If the application should be usable from a fat client additionally to the web, we add a fat client input adapter. If the application needs a different database, we add a new persistence adapter implementing the same output port interfaces as the old one.

**Examples:**

```java
@RequiredArgsConstructor
@Component
class AccountPersistenceAdapter implements
    LoadAccountPort,
    UpdateAccountStatePort {

  private final AccountRepository accountRepository;
  private final ActivityRepository activityRepository;
  private final AccountMapper accountMapper;

  @Override
  public Account loadAccount(
          AccountId accountId,
          LocalDateTime baselineDate) {

    AccountJpaEntity account =
        accountRepository.findById(accountId.getValue())
            .orElseThrow(EntityNotFoundException::new);

    List<ActivityJpaEntity> activities =
        activityRepository.findByOwnerSince(
            accountId.getValue(),
            baselineDate);

    Long withdrawalBalance = orZero(activityRepository
        .getWithdrawalBalanceUntil(
            accountId.getValue(),
            baselineDate));

    Long depositBalance = orZero(activityRepository
        .getDepositBalanceUntil(
            accountId.getValue(),
            baselineDate));

    return accountMapper.mapToDomainEntity(
        account,
        activities,
        withdrawalBalance,
        depositBalance);

  }

  private Long orZero(Long value){
    return value == null ? 0L : value;
  }

  @Override
  public void updateActivities(Account account) {
    for (Activity activity : account.getActivityWindow().getActivities()) {
      if (activity.getId() == null) {
        activityRepository.save(accountMapper.mapToJpaEntity(activity));
      }
    }
  }

}
```

The adapter implements the loadAccount() and updateActivities() methods required by the implemented output ports. It uses Spring Data repositories to load data from and save data to the database and an AccountMapper to map Account domain objects into AccountJpaEntity objects which represent an account within the database.

Again, we use @Component to make this a Spring bean that can be injected into the use case service above.

### File Structure

All usecase codes will be in separate folder of it's domain. Such as for library app, example of a domain is: book and usecase example is add book.

```
src/
 ├──book/                  * Book domain folder to contain book usecases
 │   │──add/               * Add book usercase folder
 |   |   │──ports/         * Contains both input/output port codes
 |   |   └──index.js       * Contains add book usercase code
 │   │
 │──components/            * Contains all UI components
 │──containers/            * Contains all container components to build app combining multiple components
 │──pages/                 * Contains all page files
 │──services/              * Contain services which acts like output adapters use domain ports to provide a service such as database connection
 │──use-classes/           * Contain use-classes which initiates everything for specific use cases along with input/output ports and input/output adapters
 |──index.js               * Our entry file for app
 |
 └──package.json           * All packages and dependencies addition
```

[![-----------------------------------------------------][colored-line]](#installation)

## ➤ Data Flow for Hexagonal Architecture

* **Domains and use cases:** Every domain consists of different use cases such as `Book` domain can contain use cases: `addBook`, `updateBook` and `listBook`.

* **Ports and data flow:** Every app component or sub-app communicate with use cases through input ports. App components send data using input port which is then received by specific use case. Data received from input port, is processed and if required is transferred to output port. Output port uses output adapter to receive data from outside sources such as - REST APIs, GraphQL, LocalStorage etc. Output adapter uses repositories which acts as ways to receive data from outside sources. Output adapter and port should return promise so that it is consistent in different ways of data fetching. When promise returned by output port is resolved, the data retrieved by use case is sent to output port. Use cases communicates with outside world through output ports.

* **Ports and events:** Communication to and from use cases are done using port events. To communicate with use cases, app components emits an event which is captured by event handler inside input port. The data retrieved by input port event handler, is transferred to specific use case function. Once processing and retrieving data, use cases communicate through output port. Output port emits event that can be captured by even handlers in our app components.

* **Output adapter and repository:** When data is required from external sources, use cases need output port. Output port uses output adapters which are used to retrieve and process data from external sources. Output adapter uses repository to fetch data, when data is provided from repository, it then should be processed by output adapter to convert into format expected by use case.

* **Use classes:** We can include use-classes which are nothing just a function which initializes everything for specific use cases along with input/output ports and input/output adapters. The main advantage of using use classes are better code reusability. These are just simple functions which setup a use case with ports and adapters. Instead of duplicating same code to setup these things, using use-classes are great solution. The use-class function accepts an optional single argument which is event bus object. When provided, the use case ports are setup to make use of the provided ports. If the even bus is not provided, new one is created to be used by use case. The use-class function returns event bus being used by the use class ports.


[![-----------------------------------------------------][colored-line]](#installation)

## ➤ Example

Suppose we are designing a library app. Here is how we will setup usecases, ports and adapters:

### src/book/add/index.js

```js
const addBookUseCase = (ports) => ({
    addNewBook(name, author, ISBN) {
        const book = ports.findBook(ISBN);
        if (book) {
            return ports.onBookAdded(null, 'Book aleady exists. Failed to add book.');
        }
        const response = ports.addBook(name, author, ISBN);

        if (response) {
            return ports.onBookAdded(response);
        }
        return ports.onBookAdded(null, 'Book addition failed.');
    },
});

module.exports = addBookUseCase;
```

### src/book/add/ports/in.js

```js
const addBookInputPort = (useCase, bus) => {
    bus.on('add-book', (name, author, ISBN) => {
        useCase.addNewBook(name, author, ISBN);
    });
};

module.exports = addBookInputPort;
```

### src/book/add/ports/out.js

```js
const addBookOutputPort = (bus, adapters) => ({
    findBook(ISBN) {
        return adapters.findBook(ISBN);
    },
    addBook(name, author, ISBN) {
        return adapters.addBook(name, author, ISBN);
    },
    onBookAdded(response, message) {
        return bus.emit('book-added', response, message);
    },
});

module.exports = addBookOutputPort;
```

### src/services/book/add/index.js

```js
const addNewBook = (repository) => (name, author, isbn) => {
    const req = repository.addBook({ name, author, isbn });
    return req.response.data;
};

module.exports = addNewBook;
```

### src/services/book/index.js

```js
const axios = require('axios');

const bookRepository = {
    addBook({ name, author, isbn }){
        return axios.post('/add-book', { name, author, isbn });
    },
    findBook(isbn){
        return axios.get(`/book/${isbn}`);
    }
};

module.exports = bookRepository;
```

### src/containers/AddBook/index.jsx

```js
const React = require('react');
const AddBookForm = require('components/AddBookForm');

const AddBook = ({ bus }) => {
    bus.on('book-added', (response, message) => {
        if (response) {
            alert('Book added successfully.');
        } else {
            alert(message);
        }
    });

    const onSubmit = ({ name, author, isbn }) => {
        bus.emit('add-book', name, author, isbn);
    };

    return (
        <AddBookForm onSubmit={onSubmit} />
    );
};

module.exports = AddBook;
```

### src/pages/AddBook/index.jsx

```js
const React = require('react');
const events = require('nanoevents');
const AddBook = require('containers/AddBook');
const bookRepository = require('services/book');
const addBook = require('services/book/add');
const findBook = require('services/book/find');
const addBookUseCase = require('book/add');
const addBookInputPort = require('book/add/ports/in');
const addBookOutputPort = require('book/add/ports/out');

const AddBookPage = () => {
    const bus = events.createNanoEvents();
    const outputPort = addBookOutputPort(bus, { addBook: addBook(bookRepository), findBook: findBook(bookRepository) });
    const useCase = addBookUseCase(outputPort);
    addBookInputPort(useCase, bus);

    return (
        <AddBook bus={bus} />
    );
};

module.exports = AddBookPage;
```

Above example is simple example of hexagonal architecture in JavaScript with ReactJS.

* Think of every page as entry of separate app. This page will include all use cases used on the page and initialize them together.

* Every page will contain a container component which is responsible for building entire page layout by combining multiple components.

* Container component and it's children will only communicate with use case by emitting event through event bus (which are use case input ports). The event bus should be provided as props. The use case and communicate through output port which emits event to pass message back to container component. It makes input port, UI components, output port and use cases separate from each other.

* Do not use single global event bus. Instead use event bus which can be shared to use cases so that all events required to a specific part of application is under same bus and prevent conflict with event from other use cases.

* Input port (created as bus event handler) is used by UI components (which are input adapters). Use cases use output port directly and output port is responsible to communicate with outer world through output adapters (which are services). Use cases should not emit event and should only communicate to outer world through output port. Output ports can emit event to inform about status of action taken by input adapters through input ports. Such as add book UI can only use add book input port and use case can only use add book output port and once book is added, use case will use notify add book output port which then will emit event to inform about completion of the action.

* Services act as output adapters which are responsible for allowing use cases to communicate to outside services such as database, REST APIs.

* All services should be independent of medium used for adding/retrieving data. Services should use repository for this purpose. In above example services use a technique called *currying* to accept repository as parameter of first function and then return service function used by output port.

* Repositories act as way to communicate with medium for adding/retrieving data such as database connection, REST APIs etc.

* Separating repositories and services allows to use same service in different type of medium without changing code as long as both have same interfaces.

* Using event bus as communication channel makes input adapters, use cases and output adapters completely separate from each other. [Nanoevents](https://github.com/ai/nanoevents) is a great example for simple event bus.

[![-----------------------------------------------------][colored-line]](#installation)

## ➤ Getting Started

### Dependencies
Tools needed to run this app:
* `node` and `npm`

#### Install Node.js

Node.js is an environment that can run JavaScript code outside of a web browser and is used to write and run server-side JavaScript apps. Node.js installation includes `npm`, the package manager that allows you to install NPM modules from your terminal. 
You can download an installer from the [Node.js homepage](https://nodejs.org/en/).

##### Check your Node.js installation

Check that you have the minimum required version installed by running the following command:

```sh
node -v
```

You should see a version larger than Node 10.

```sh
node -v
v12.14.0
```

> Project name' minimum supported Node.js version is Node 10, but more recent versions will work as well.


### Installing
* `fork` this repo
* `clone` your fork
* `npm install` to install dependencies


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[colored-line]: ./.docs/lines/colored.png
[project-logo]: ./.docs/logo.png
