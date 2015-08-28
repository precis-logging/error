var ErrorSection = React.createClass({
  render(){
    return(
      <div>
        <h2 className="sub-header">Error Transactions</h2>
        <InjectedComponentSet
          tagName="div"
          containerRequired={false}
          matching={{role: 'error-transactions-stats'}}
          exposedProps={{segments: [
              {
                title: 'Last Minute',
                minutes: 1,
              },
              {
                title: 'Last 5 Minutes',
                minutes: 5,
              },
              {
                title: 'Last 15 Minutes',
                minutes: 15,
              },
            ]}}
          />
      </div>
    );
  }
});

Actions.register(ErrorSection, {role: 'dashboard-section'});
