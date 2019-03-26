import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { Header } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import * as React from "react";
import { connect } from "react-redux";
import { Card } from "../../../components/cards/card";
import { SubTitle } from "../../../components/subtitle";
import { Votes } from "../../../components/votes";
import { WorkItemDescription } from "../../../components/workitems/workItemDescription";
import { WorkItemHeader } from "../../../components/workitems/workItemHeader";
import { WorkItemStoryPoints } from "../../../components/workitems/workItemStoryPoints";
import { ICard, ICardSet } from "../../../model/cards";
import { IEstimate } from "../../../model/estimate";
import { IIdentity } from "../../../model/identity";
import { IWorkItem } from "../../../model/workitem";
import { IState } from "../../../reducer";
import { commitCard, estimate, reveal } from "../sessionActions";
import "./workItemView.scss";
import { TextField } from "azure-devops-ui/TextField";

interface IWorkItemProps {
    identity: IIdentity;
    selectedWorkItem: IWorkItem;
    cardSet: ICardSet;

    /** User's selection */
    selectedCardId: string | null;
    estimates: IEstimate[];

    revealed: boolean;
    canReveal: boolean;
}

const Actions = {
    estimate,
    reveal,
    commitCard
};

class WorkItemView extends React.Component<IWorkItemProps & typeof Actions> {
    render() {
        const {
            cardSet,
            selectedWorkItem,
            selectedCardId,
            estimates,
            canReveal,
            revealed
        } = this.props;

        return (
            <CustomCard className="work-item-view flex-grow">
                <Header
                    commandBarItems={
                        [
                            canReveal &&
                                ({
                                    id: "action-reveal",
                                    text: "Reveal",
                                    important: true,
                                    isPrimary: true,
                                    onActivate: this.doReveal
                                } as IHeaderCommandBarItem)
                        ].filter(x => !!x) as IHeaderCommandBarItem[]
                    }
                >
                    <WorkItemHeader workItem={selectedWorkItem} />
                </Header>

                <CardContent>
                    <div className="flex-grow flex-column">
                        <WorkItemDescription workItem={selectedWorkItem} />

                        <WorkItemStoryPoints estimate={0} />

                        <SubTitle>Your vote</SubTitle>
                        <div className="card-container">
                            {cardSet &&
                                cardSet.cards.map(card =>
                                    this.renderCard(
                                        card,
                                        revealed,
                                        card.identifier === selectedCardId,
                                        this.doEstimate.bind(this, card)
                                    )
                                )}
                        </div>

                        <SubTitle>All votes</SubTitle>
                        <Votes
                            cardSet={cardSet}
                            estimates={estimates || []}
                            revealed={revealed}
                        />

                        <SubTitle>Actions</SubTitle>
                        {revealed && (
                            <>
                                <div>
                                    These were the cards selected, choose one to
                                    commit the value to the work item:
                                </div>
                                <div>
                                    {(estimates || []).map(e => {
                                        const card = cardSet.cards.find(
                                            x =>
                                                x.identifier ===
                                                e.cardIdentifier
                                        )!;
                                        return this.renderCard(
                                            card,
                                            false,
                                            false,
                                            this.doCommitCard.bind(this, card)
                                        );
                                    })}
                                </div>
                                <div>
                                    Or enter a custom value:
                                    <TextField
                                        onChange={this._onChangeCustomValue}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </CustomCard>
        );
    }

    private _onChangeCustomValue = () => {};

    private renderCard = (
        card: ICard,
        disabled?: boolean,
        selected?: boolean,
        onClick?: () => void
    ): JSX.Element => {
        return (
            <Card
                key={card.identifier}
                front={{
                    label: card.identifier
                }}
                flipped={false}
                onClick={onClick}
                disabled={disabled}
                selected={selected}
            />
        );
    };

    private doReveal = () => {
        this.props.reveal();
    };

    private doEstimate = (card: ICard): void => {
        const { estimate, identity, selectedWorkItem } = this.props;

        estimate({
            identity,
            workItemId: selectedWorkItem.id,
            cardIdentifier: card.identifier
        });
    };

    private doCommitCard = (card: ICard): void => {
        const { commitCard } = this.props;

        commitCard(card);
    };
}

export default connect(
    (state: IState) => {
        const { session } = state;

        const estimates = session.estimates[session.selectedWorkItem!.id];

        return {
            identity: state.init.currentIdentity!,
            cardSet: session.cardSet!,
            selectedWorkItem: session.selectedWorkItem!,
            estimates,
            revealed: session.revealed,
            canReveal: !session.revealed && estimates && estimates.length > 0,
            selectedCardId:
                state.session.ownEstimate &&
                state.session.ownEstimate.cardIdentifier
        };
    },
    Actions
)(WorkItemView);
